const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS,},
});


const sendEmail = async (to, code) => {

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to,
    subject: "ExpenseMate - Password Reset Code",
    text:
      `Your ExpenseMate password reset verification code is: ${code}.\n\n` +
      `This code will expire in 5 minutes.\n\n` +
      `If you did not request a password reset, please ignore this email.`,
  });

};


module.exports = {sendEmail};