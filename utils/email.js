// utils/email.js — Email sending via Resend (nodemailer)

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInviteEmail = async ({ to, token, companyName, role }) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from:    `"AttendFlow" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `You're invited to join ${companyName} on AttendFlow`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #0a0a0b;">You've been invited! ⚡</h2>
        <p style="color: #6b6b72;">You have been invited to join <strong>${companyName}</strong> on AttendFlow as a <strong>${role}</strong>.</p>
        <p style="color: #6b6b72;">Click the button below to set up your account:</p>
        <a href="${inviteUrl}" style="display:inline-block; background:#f59e0b; color:#000; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:700; margin: 16px 0;">
          Accept Invitation →
        </a>
        <p style="color: #6b6b72; font-size: 12px;">This invite expires in 7 days. If you didn't expect this, ignore this email.</p>
        <p style="color: #6b6b72; font-size: 12px;">Or copy this link: ${inviteUrl}</p>
      </div>
    `,
  });
};

module.exports = { sendInviteEmail };
