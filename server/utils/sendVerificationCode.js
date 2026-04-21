import { generateVerificationOtpEmailTemplate } from "./emailTemplates.js";
import { sendEmail } from "./sendEmail.js";

export async function sendVerificationCode(verificationCode, email, res) {
    try {
        const message = generateVerificationOtpEmailTemplate(verificationCode);
        await sendEmail({
            email,
            subject: "verification Code ( Learn Hub )",
            message,
        });

        res.status(200).json({
            success: true,
            message: "verification code sent successfully.",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Verification code failed to send.",
        });
    }
}
