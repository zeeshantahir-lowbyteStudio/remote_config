const nodemailer = require("nodemailer");

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function inviteEmailHtml({ inviteeName, inviterName, email, password, loginUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to Remote Config</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; }
    .header { background: #18181b; padding: 28px 32px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .header p { margin: 4px 0 0; color: #a1a1aa; font-size: 13px; }
    .body { padding: 32px; }
    .body p { margin: 0 0 16px; color: #3f3f46; font-size: 14px; line-height: 1.6; }
    .creds-box { background: #f9f9fb; border: 1px solid #e4e4e7; border-radius: 6px; padding: 20px 24px; margin: 24px 0; }
    .creds-box .row { display: flex; align-items: center; margin-bottom: 10px; }
    .creds-box .row:last-child { margin-bottom: 0; }
    .creds-box .label { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.6px; width: 80px; flex-shrink: 0; }
    .creds-box .value { font-size: 14px; color: #18181b; font-family: 'Courier New', monospace; font-weight: 600; word-break: break-all; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn { display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-size: 14px; font-weight: 500; }
    .note { font-size: 12px; color: #a1a1aa; margin-top: 24px; padding-top: 20px; border-top: 1px solid #f4f4f5; }
    .footer { background: #fafafa; padding: 16px 32px; text-align: center; border-top: 1px solid #e4e4e7; }
    .footer p { margin: 0; font-size: 12px; color: #a1a1aa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Remote Config</h1>
      <p>Configuration management platform</p>
    </div>
    <div class="body">
      <p>Hi${inviteeName ? " " + inviteeName : ""},</p>
      <p>
        <strong>${inviterName}</strong> has invited you to join <strong>Remote Config</strong>.
        Your account has been created and is ready to use.
      </p>
      <p>Here are your login credentials:</p>
      <div class="creds-box">
        <div class="row">
          <span class="label">Email</span>
          <span class="value">${email}</span>
        </div>
        <div class="row">
          <span class="label">Password</span>
          <span class="value">${password}</span>
        </div>
      </div>
      <div class="btn-wrap">
        <a href="${loginUrl}" class="btn">Sign in to Remote Config</a>
      </div>
      <p class="note">
        For security, please change your password after your first login.
        If you were not expecting this invitation, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      <p>This is an automated message from Remote Config &mdash; please do not reply.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendInviteEmail({ to, inviteeName, inviterName, password }) {
  const transporter = createTransporter();
  const loginUrl = process.env.APP_URL || "http://localhost:5173";

  const info = await transporter.sendMail({
    from: `"Remote Config" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `You've been invited to Remote Config`,
    html: inviteEmailHtml({ inviteeName, inviterName, email: to, password, loginUrl }),
  });

  return info;
}

module.exports = { sendInviteEmail };
