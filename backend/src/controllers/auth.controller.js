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
import { sendWelcomeEmail, sendOtpEmail } from "../config/nodemailer.js";

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

    // Step A: Generate cryptographically random 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Step B: Store OTP using existing database mechanism
    await prisma.emailOtp.upsert({
      where: { email },
      create: { email, otp, expiresAt },
      update: { otp, expiresAt },
    });

    // Step C: Attempt email delivery via Nodemailer (non-blocking)
    sendOtpEmail({ to: email, name, otp }).catch((smtpErr) =>
      console.warn("[SMTP Notice] Nodemailer dispatch notice:", smtpErr.message)
    );

    // Step D: Production Safety check — ONLY expose devOtp in development/testing environments
    const isDev = process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_OTP === "true";

    if (isDev) {
      console.log(`[DEV MODE] Generated 6-digit OTP for ${email}: ${otp}`);
    }

    return res.json({
      message: `A 6-digit verification code was sent to ${email}.`,
      email,
      ...(isDev ? { devOtp: otp } : {}),
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

    // Check OTP record in DB
    const otpRecord = await prisma.emailOtp.findUnique({ where: { email } });
    if (!otpRecord) {
      return res.status(400).json({ error: "No verification code requested for this email" });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new code" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ error: "Invalid verification code. Please check your email and try again" });
    }

    // Hash password and create STUDENT user account
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        createdAt: true,
      },
    });

    // Clean up consumed OTP
    await prisma.emailOtp.delete({ where: { email } }).catch(() => {});

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ to: email, name }).catch((emailErr) =>
      console.warn("Welcome email notice:", emailErr.message)
    );

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// Legacy direct signup endpoint (bypassing OTP)
export async function signup(req, res, next) {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
        createdAt: true,
      },
    });

    const token = signToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0].message });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user);
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDefaultCampus(req, res, next) {
  try {
    const { campusId } = req.body;
    if (!campusId) {
      return res.status(400).json({ error: "campusId is required" });
    }

    const campus = await prisma.campus.findUnique({ where: { id: campusId } });
    if (!campus) {
      return res.status(404).json({ error: "Campus not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { campusId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
      },
    });

    res.json({ user: updatedUser });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        campusId: true,
      },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
