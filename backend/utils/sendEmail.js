const nodemailer = require("nodemailer");

function getTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
}

const sendEmail = async (to, code) => {
  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: to,
        subject: "ExpenseMate - Password Reset Code",
        text:
          `Your ExpenseMate password reset verification code is: ${code}.\n\n` +
          `This code will expire in 5 minutes.\n\n` +
          `If you did not request a password reset, please ignore this email.`,
      });
      console.log(`[EMAIL] Verification code successfully sent to: ${to}`);
      return { sent: true };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    }
  }

  // Graceful fallback for dev / unconfigured SMTP
  console.log("==================================================");
  console.log(`[VERIFICATION CODE FALLBACK]`);
  console.log(`To: ${to}`);
  console.log(`Code: ${code}`);
  console.log("==================================================");
  return { sent: false, code };
};

const sendEmail_to_invite = async (from, email, inviteText) => {
  const transporter = getTransporter();

  if (transporter) {
    try {
      await transporter.sendMail({
        from: from,
        to: email,
        subject: "ExpenseMate - Invite",
        text: inviteText,
      });
      console.log(`[EMAIL] Invitation successfully sent to: ${email}`);
      return { sent: true };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send invite to ${email}:`, err.message);
    }
  }

  console.log("==================================================");
  console.log(`[INVITE EMAIL FALLBACK] From: ${from} To: ${email}\nText:\n${inviteText}`);
  console.log("==================================================");
  return { sent: false };
};

module.exports = { sendEmail, sendEmail_to_invite };