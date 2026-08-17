import { Resend } from "resend";
import { mailer } from "../config/nodemailer.js";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Generic email dispatcher. Uses Resend HTTPS API if RESEND_API_KEY is configured.
 * Falls back to Nodemailer SMTP if RESEND_API_KEY is missing or if Resend returns an error.
 */
export async function sendEmail({ to, subject, html }) {
  if (resend) {
    try {
      // Resend default onboarding domain for testing is onboarding@resend.dev
      const defaultFrom = "CampusCanteen <onboarding@resend.dev>";
      const from = process.env.EMAIL_FROM || defaultFrom;

      const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (error) {
        console.error("❌ [Resend API Error]:", error.message || error);
        return fallbackNodemailer({ to, subject, html });
      }

      console.log("✅ [Resend API] Email sent successfully | ID:", data?.id, "| To:", to);
      return data;
    } catch (err) {
      console.error("❌ [Resend API Exception]:", err.message || err);
      return fallbackNodemailer({ to, subject, html });
    }
  }

  // Fallback to Nodemailer SMTP if RESEND_API_KEY is not configured
  return fallbackNodemailer({ to, subject, html });
}

async function fallbackNodemailer({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email Dev Log] (No RESEND_API_KEY or SMTP configured) To: ${to} | Subject: "${subject}"`);
    return null;
  }

  try {
    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"CampusCanteen" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ [Nodemailer Fallback] Email sent successfully:", result.messageId, "| To:", to);
    return result;
  } catch (error) {
    console.error("❌ [Nodemailer Fallback Error]:", error.message || error);
    return null;
  }
}

// -----------------------------------------------------------------
// REUSABLE EMAIL TEMPLATES & FUNCTIONS
// -----------------------------------------------------------------

// 1. Signup Verification / OTP Email
export async function sendVerificationEmail({ to, name, otp }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; color: #111;">
      <div style="background-color: #f97316; color: #fff; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 22px;">CampusCanteen — Verify Your Email</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Thank you for signing up for CampusCanteen. Use the 6-digit verification code below to complete your registration:</p>
      
      <div style="margin: 25px 0; text-align: center;">
        <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; background-color: #f3f4f6; color: #111; padding: 12px 24px; border-radius: 8px; border: 2px dashed #f97316; display: inline-block;">
          ${otp}
        </span>
      </div>

      <p style="font-size: 13px; color: #666; text-align: center;">
        This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">CampusCanteen • Skip the line every day</p>
    </div>
  `;
  return sendEmail({ to, subject: `CampusCanteen Email Verification Code: ${otp}`, html });
}

export const sendOtpEmail = sendVerificationEmail;

// 2. Welcome Email
export async function sendWelcomeEmail({ to, name }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background-color: #f97316; color: #fff; padding: 15px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 24px;">Welcome to CampusCanteen!</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your account is ready. You can now browse canteen menus, order food ahead, get instant atomic daily tokens, and skip the line!</p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" style="background-color: #f97316; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; display: inline-block;">Start Ordering Now</a>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777; text-align: center;">CampusCanteen • Skip the line every day</p>
    </div>
  `;
  return sendEmail({ to, subject: "Welcome to CampusCanteen!", html });
}

// 3. Order Placed / Confirmation Email
export async function sendOrderPlacedEmail({ to, name, order }) {
  const itemsHtml = order.items
    ?.map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}x ${item.menuItem?.name || "Item"}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${(Number(item.price) * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background-color: #111; color: #fff; padding: 15px 20px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">Order Received!</h2>
        <h1 style="margin: 10px 0 0 0; font-size: 36px; letter-spacing: 1px;">Token #${order.token}</h1>
      </div>
      <p style="margin-top: 20px;">Hi <strong>${name}</strong>, your order has been sent to <strong>${order.canteen?.name}</strong>!</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; font-size: 16px; font-weight: bold; margin-bottom: 20px;">
        Total Paid (${order.payment?.method || "CASH"}): ₹${Number(order.totalAmount).toFixed(2)}
      </div>

      <p style="font-size: 13px; color: #555; background: #f0f7ff; padding: 12px; border-radius: 6px;">
        💡 Show Token <strong>#${order.token}</strong> at the canteen counter when your order status turns <strong>READY</strong>.
      </p>
    </div>
  `;
  return sendEmail({ to, subject: `Order Token #${order.token} Confirmed — ${order.canteen?.name}`, html });
}

export const sendOrderConfirmationEmail = sendOrderPlacedEmail;

// 4. Order Ready Email
export async function sendOrderReadyEmail({ to, name, order }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background-color: #10b981; color: #fff; padding: 20px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">YOUR ORDER IS READY!</h2>
        <h1 style="margin: 10px 0 0 0; font-size: 42px;">Token #${order.token}</h1>
      </div>
      <p style="margin-top: 20px; font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; color: #333;">
        Your order from <strong>${order.canteen?.name}</strong> is freshly prepared and ready for pickup right now!
      </p>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <span style="font-size: 18px; font-weight: bold; color: #111;">Head to the counter with Token #${order.token}</span>
      </div>
      <p style="font-size: 12px; color: #777; text-align: center;">Thank you for using CampusCanteen!</p>
    </div>
  `;
  return sendEmail({ to, subject: `Token #${order.token} is READY for pickup at ${order.canteen?.name}!`, html });
}

// 5. Order Cancelled Email
export async function sendOrderCancelledEmail({ to, name, order }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
      <div style="background-color: #dc2626; color: #fff; padding: 20px; border-radius: 8px; text-align: center;">
        <h2 style="margin: 0;">ORDER CANCELLED</h2>
        <h1 style="margin: 10px 0 0 0; font-size: 42px;">Token #${order.token}</h1>
      </div>
      <p style="margin-top: 20px; font-size: 16px;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 15px; color: #333;">
        Your order Token <strong>#${order.token}</strong> from <strong>${order.canteen?.name}</strong> has been cancelled.
      </p>
      <p style="font-size: 12px; color: #777; text-align: center;">If you have any questions, please speak with the canteen counter staff.</p>
    </div>
  `;
  return sendEmail({ to, subject: `Order Token #${order.token} Cancelled — ${order.canteen?.name}`, html });
}

// 6. Generic Order Status Email Wrapper
export async function sendOrderStatusEmail({ to, name, order, status }) {
  if (status === "READY") {
    return sendOrderReadyEmail({ to, name, order });
  }
  if (status === "CANCELLED") {
    return sendOrderCancelledEmail({ to, name, order });
  }
  return null;
}
