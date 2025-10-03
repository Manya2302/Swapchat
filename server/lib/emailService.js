import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Swapchat - Email Verification OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2DE2A9;">Swapchat Email Verification</h2>
        <p>Your OTP for email verification is:</p>
        <h1 style="background: #f4f4f4; padding: 20px; text-align: center; letter-spacing: 5px; color: #2DE2A9;">
          ${otp}
        </h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 12px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

export async function sendIPAuthorizationEmail(email, username, ip, authUrl) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Swapchat - New Login Detected',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2DE2A9;">🔐 New Login Detected</h2>
        <p>Hello <strong>${username}</strong>,</p>
        <p>We detected a login attempt from a new IP address:</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>IP Address:</strong> ${ip}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If this was you, click the button below to authorize this device:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${authUrl}" 
             style="background: #2DE2A9; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Authorize This Device
          </a>
        </div>
        <p style="color: #FF6B6B; font-weight: bold;">
          If this wasn't you, please change your password immediately.
        </p>
        <p style="color: #666; font-size: 12px;">
          This authorization link will expire in 1 hour.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('IP Authorization email error:', error);
    return false;
  }
}
