import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

function createTransporter() {
  // Use GoDaddy SMTP (info@fleetwizards.com) if configured
  if (ENV.fleetEmailUser && ENV.fleetEmailPassword) {
    return nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: ENV.fleetEmailUser,
        pass: ENV.fleetEmailPassword,
      },
    });
  }
  // Fallback to Gmail
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: ENV.gmailFrom,
      pass: ENV.gmailAppPassword,
    },
  });
}

function getSenderAddress() {
  if (ENV.fleetEmailUser && ENV.fleetEmailPassword) {
    return `FleetWizards <${ENV.fleetEmailUser}>`;
  }
  return `FleetWizards <${ENV.gmailFrom}>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const hasFleetEmail = ENV.fleetEmailUser && ENV.fleetEmailPassword;
  const hasGmail = !!ENV.gmailAppPassword;

  if (!hasFleetEmail && !hasGmail) {
    console.warn("[Email] No email credentials configured — skipping email send");
    return false;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to} from ${getSenderAddress()}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, error);
    return false;
  }
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  padding: 40px 20px;
`;

const cardStyle = `
  background: #ffffff;
  border-radius: 12px;
  padding: 40px;
  max-width: 560px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
`;

const logoStyle = `
  font-size: 24px;
  font-weight: 700;
  color: #1e40af;
  margin-bottom: 32px;
  display: block;
`;

const h1Style = `
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
`;

const pStyle = `
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 16px 0;
`;

const btnStyle = (bg = "#1e40af") => `
  display: inline-block;
  background: ${bg};
  color: #ffffff;
  text-decoration: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  margin: 8px 0 24px 0;
`;

const footerStyle = `
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 32px;
`;

const dividerStyle = `
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 24px 0;
`;

function footer() {
  return `
    <hr style="${dividerStyle}" />
    <p style="${footerStyle}">
      FleetWizards · Car Rental Management Platform<br/>
      This is an automated message — please do not reply to this email.
    </p>
  `;
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <span style="${logoStyle}">🚗 FleetWizards</span>
        <h1 style="${h1Style}">Reset your password</h1>
        <p style="${pStyle}">
          We received a request to reset the password for your FleetWizards account.
          Click the button below to choose a new password.
        </p>
        <a href="${resetLink}" style="${btnStyle()}">Reset Password</a>
        <p style="${pStyle}">
          This link will expire in <strong>24 hours</strong>. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <p style="font-size: 13px; color: #6b7280;">
          Or copy this link into your browser:<br/>
          <span style="color: #1e40af; word-break: break-all;">${resetLink}</span>
        </p>
        ${footer()}
      </div>
    </div>
  `;
  return sendEmail(to, "Reset your FleetWizards password", html);
}

export async function sendWelcomeEmail(to: string, username: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <span style="${logoStyle}">🚗 FleetWizards</span>
        <h1 style="${h1Style}">Welcome to FleetWizards, ${username}!</h1>
        <p style="${pStyle}">
          Your account has been created successfully. You can now log in and start managing your fleet.
        </p>
        <a href="https://fleetwizards.app" style="${btnStyle()}">Go to Dashboard</a>
        <p style="${pStyle}">
          With FleetWizards you can manage your vehicles, clients, contracts, invoices, and maintenance — all in one place.
        </p>
        ${footer()}
      </div>
    </div>
  `;
  return sendEmail(to, "Welcome to FleetWizards! 🚗", html);
}

export async function sendSubscriptionApprovedEmail(to: string, username: string, planName: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <span style="${logoStyle}">🚗 FleetWizards</span>
        <h1 style="${h1Style}">Your subscription is now active! ✅</h1>
        <p style="${pStyle}">
          Hi <strong>${username}</strong>, your Whish Money payment for the <strong>${planName}</strong> plan has been verified and your subscription is now active.
        </p>
        <a href="https://fleetwizards.app/dashboard" style="${btnStyle("#16a34a")}">Go to Dashboard</a>
        <p style="${pStyle}">
          You now have full access to all features included in the <strong>${planName}</strong> plan. Thank you for choosing FleetWizards!
        </p>
        ${footer()}
      </div>
    </div>
  `;
  return sendEmail(to, `Your ${planName} subscription is active — FleetWizards`, html);
}

export async function sendSubscriptionRejectedEmail(to: string, username: string, planName: string, reason: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <span style="${logoStyle}">🚗 FleetWizards</span>
        <h1 style="${h1Style}">Payment could not be verified</h1>
        <p style="${pStyle}">
          Hi <strong>${username}</strong>, unfortunately we were unable to verify your Whish Money payment for the <strong>${planName}</strong> plan.
        </p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px; color: #b91c1c;"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p style="${pStyle}">
          Please try again or contact us if you believe this is a mistake.
        </p>
        <a href="https://fleetwizards.app/subscription-plans" style="${btnStyle("#dc2626")}">Try Again</a>
        ${footer()}
      </div>
    </div>
  `;
  return sendEmail(to, `Payment verification failed — FleetWizards`, html);
}

export async function sendPasswordResetByAdminEmail(to: string, username: string, temporaryPassword: string) {
  const html = `
    <div style="${baseStyle}">
      <div style="${cardStyle}">
        <span style="${logoStyle}">🚗 FleetWizards</span>
        <h1 style="${h1Style}">Your password has been reset</h1>
        <p style="${pStyle}">
          Hi <strong>${username}</strong>, an administrator has reset your FleetWizards account password.
        </p>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #6b7280;">Your temporary password:</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #1e40af; font-family: monospace;">${temporaryPassword}</p>
        </div>
        <p style="${pStyle}">Please log in and change your password immediately.</p>
        <a href="https://fleetwizards.app/signin" style="${btnStyle()}">Sign In</a>
        ${footer()}
      </div>
    </div>
  `;
  return sendEmail(to, "Your FleetWizards password has been reset", html);
}
