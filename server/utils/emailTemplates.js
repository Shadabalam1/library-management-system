export function generateVerificationOtpEmailTemplate (otpCode){
    return  `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <div style="text-align: center; padding: 20px 0; background-color: #4a6fa5; border-radius: 10px 10px 0 0; color: white;">
    <h1 style="margin: 0; font-size: 28px;">Welcome!</h1>
    <p style="margin: 5px 0 0; font-size: 16px; opacity: 0.9;">Verify your email address</p>
  </div>

  <div style="padding: 30px; background-color: white; border-radius: 0 0 12px 12px; color: #333;">
    <p style="font-size: 16px; line-height: 1.6;">
      Aapke account ko verify karne ke liye niche diya gaya OTP code istemal karein:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 24px; font-weight: bold; letter-spacing: 8px; color: #4a6fa5; background-color: #f0f4ff; padding: 12px 24px; border-radius: 8px; display: inline-block; box-shadow: inset 0 2px 6px rgba(0,0,0,0.1);">
        ${otpCode}
      </span>
    </div>

    <p style="font-size: 15px; color: #555;">
      Yeh code <strong>5 minute</strong> ke liye valid hai. Kripya ise kisi ke saath share na karein.
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

    <p style="font-size: 14px; color: #888; text-align: center;">
      Agar aapne ye request nahi ki thi, to kripya is email ko nazarandaaz karein.
    </p>
  </div>

  <div style="text-align: center; margin-top: 20px; font-size: 13px; color: #aaa;">
    &copy; 2025 Learn Hub. Sabhi adhikar samrakshit.
  </div>
</div>`
}


export function generateForgotPasswordEmailTemplate(resetPasswordUrl) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="text-align: center; padding: 20px 0; background-color: #4a6fa5; border-radius: 10px 10px 0 0; color: white;">
        <h1 style="margin: 0; font-size: 28px;">Password Reset</h1>
        <p style="margin: 5px 0 0; font-size: 16px; opacity: 0.9;">Reset your account password</p>
      </div>

      <div style="padding: 30px; background-color: white; border-radius: 0 0 12px 12px; color: #333;">
        <p style="font-size: 16px; line-height: 1.6;">
          We received a request to reset the password for your account. If you made this request, please click the button below:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetPasswordUrl}" style="font-size: 16px; font-weight: bold; color: white; background-color: #4a6fa5; padding: 14px 30px; border-radius: 8px; text-decoration: none; display: inline-block; box-shadow: 0 4px 8px rgba(74, 111, 165, 0.3);">
            Reset Password
          </a>
        </div>

        <p style="font-size: 15px; color: #555;">
          This link will expire in <strong>15 minutes</strong>. If you didn't request a password reset, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

        <p style="font-size: 14px; color: #888; text-align: center;">
          If the "Reset Password" button doesn't work, copy and paste the link below into your browser:<br>
          <a href="${resetPasswordUrl}" style="color: #4a6fa5; word-break: break-all; font-size: 14px;">${resetPasswordUrl}</a>
        </p>
      </div>

      <div style="text-align: center; margin-top: 20px; font-size: 13px; color: #aaa;">
        &copy; 2025 Learn Hub. All rights reserved.
      </div>
    </div>
  `;
}