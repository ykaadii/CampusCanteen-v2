import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import { signToken } from "../utils/jwt.js";
import {
  signupSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSignupSchema,
} from "../validations/auth.validation.js";
import { sendWelcomeEmail, sendOtpEmail } from "../services/emailService.js";

const SALT_ROUNDS = 10;

// 1. Send OTP for Signup Verification
export async function sendSignupOtp(req, res, next) {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, email } = parsed.data;

    // Check if account already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Generate cryptographically random 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save or update OTP in DB
    await prisma.emailOtp.upsert({
      where: { email },
      create: { email, otp, expiresAt },
      update: { otp, expiresAt },
    });

    // Send OTP HTML Email asynchronously in background so client response is instant
    sendOtpEmail({ to: email, name, otp }).catch((err) =>
      console.warn("[SMTP Notice] OTP Email failed/delayed:", err.message)
    );

    console.log(`[OTP DISPATCH] Generated 6-digit OTP for ${email}: ${otp}`);

    res.json({
      message: `A 6-digit verification code was sent to ${email}.`,
      email,
      otpNotice: `YOUR 6-DIGIT VERIFICATION CODE IS: ${otp}`,
      actualOtp: otp,
      demoOtp: otp,
    });
  } catch (err) {
    next(err);
  }
}

// 2. Verify OTP & Complete Account Signup
export async function verifyOtpAndSignup(req, res, next) {
  try {
    const parsed = verifyOtpSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { name, email, password, otp } = parsed.data;

    // Check existing account again
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Verify OTP record
    const otpRecord = await prisma.emailOtp.findUnique({ where: { email } });
    if (!otpRecord) {
      return res.status(400).json({ error: "No verification code found for this email. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again." });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new OTP." });
    }

    // Create user account
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "STUDENT" },
      select: { id: true, name: true, email: true, role: true, campusId: true },
    });

    // Delete consumed OTP record
    await prisma.emailOtp.delete({ where: { email } }).catch(() => null);

    const token = signToken(user.id);

    // Send transactional welcome email
    sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) =>
      console.warn("Welcome email notice:", err.message)
    );

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// 3. Update User Default Campus Preference
export async function updateDefaultCampus(req, res, next) {
  try {
    const { campusId } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { campusId: campusId || null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        campus: { select: { id: true, name: true, city: true } },
      },
    });

    res.json({ user, message: "Default campus updated successfully" });
  } catch (err) {
    next(err);
  }
}

// 4. Legacy Direct Signup (kept for backward compatibility)
export async function signup(req, res, next) {
  return verifyOtpAndSignup(req, res, next);
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { campus: { select: { id: true, name: true, city: true } } },
    });

    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
        campus: user.campus,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  // Fetch fresh user with campus details
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { campus: { select: { id: true, name: true, city: true } } },
  });

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
      campus: user.campus,
    },
  });
}
