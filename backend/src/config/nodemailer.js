import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  connectionTimeout: 5000,
  socketTimeout: 8000,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendEmail({ to, subject, html }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[SMTP DEV LOG] Email to: ${to} | Subject: "${subject}"`);
    return null;
  }

  return mailer.sendMail({
    from: process.env.EMAIL_FROM || `"CampusCanteen" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

// 0. Signup OTP Verification Email Template
export async function sendOtpEmail({ to, name, otp }) {
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

// 1. Welcome Email Template
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

// 2. Order Confirmation Email Template
export async function sendOrderConfirmationEmail({ to, name, order }) {
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

// 3. Order Ready Email Template
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
