

import cron from "node-cron";
import { Borrow } from "../models/borrowModel.js";
import { User } from "../models/userModel.js";
import { sendEmail } from "../utils/sendEmail.js";

export const notifyUser = () => {
  cron.schedule("*/50 *  * * *", async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const borrowers = await Borrow.find({
        dueDate: {
          $lt: oneDayAgo,
        },
        returnDate: null,
        notified: false,
      });

      console.log(`🔍 Found ${borrowers.length} overdue books`);

      for (const element of borrowers) {
        if (element.user && element.user.email) {
          try {
            // ✅ Wrap each borrower in try-catch
            const user = await User.findById(element.user._id);

            const message = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center;">
        <h1>📚 LEARN HUB</h1>
    </div>
    <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Hello ${user?.name || 'User'},</h2>
        <p>This is a friendly reminder that the following book is due for return:</p>
        
        <h3>📖 Book Details:</h3>
        <ul>
            <li><strong>Book Title:</strong> ${element.book?.title || "N/A"}</li>
            <li><strong>Borrowed Date:</strong> ${new Date(
              element.borrowDate
            ).toLocaleDateString()}</li>
            <li><strong>Due Date:</strong> ${new Date(
              element.dueDate
            ).toLocaleDateString()}</li>
        </ul>
        
        <p>Please return the book to the library at your earliest convenience to avoid any late fees.</p>
        
        <p>If you have already returned the book, please ignore this message.</p>
        
        <p>Thank you for using our library services!</p>
    </div>
    <div style="padding: 20px; text-align: center; font-size: 12px; color: #666;">
        <p>LEARN HUB | Contact: ${
          process.env.LIBRARY_EMAIL || "library@lms.com"
        }</p>
    </div>
</div>`;

            // ✅ AWAIT the email
            await sendEmail({
              email: element.user.email,
              subject: "📚 Book Return Reminder - LEARN HUB",
              message: message,
            });

            console.log(`📧 Email sent successfully to ${element.user.email}`);

            // ✅ Only update if email successful
            element.notified = true;
            await element.save();
            console.log(`✅ Notification status updated for ${element.user.email}`);

          } catch (emailError) {
            // ✅ If email fails, DON'T update notified status
            console.error(`❌ Failed to notify ${element.user.email}:`, emailError.message);
            // Will retry next time since notified = false
          }
        }
      }
    } catch (error) {
      console.error("❌ Error in notification cron job:", error.message);
    }
  });
};

export default notifyUser;