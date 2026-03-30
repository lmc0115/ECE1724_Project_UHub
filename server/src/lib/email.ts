import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Using Ethereal test email account:", testAccount.user);
  }

  return transporter;
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  role: string
): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}&role=${role}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="color: #111; margin-bottom: 8px;">Welcome to UHub, ${name}!</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">
        Please verify your email address to activate your account.
      </p>
      <a href="${verifyUrl}"
         style="display: inline-block; margin: 20px 0; padding: 12px 28px;
                background-color: #2563eb; color: #fff; text-decoration: none;
                border-radius: 8px; font-weight: 600; font-size: 15px;">
        Verify Email
      </a>
      <p style="color: #888; font-size: 13px; line-height: 1.5;">
        Or copy this link into your browser:<br/>
        <a href="${verifyUrl}" style="color: #2563eb; word-break: break-all;">${verifyUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">
        If you didn't create an account on UHub, you can safely ignore this email.
      </p>
    </div>
  `;

  const transport = await getTransporter();
  const info = await transport.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: "Verify your UHub email",
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log("Email preview URL:", previewUrl);
  }
}
