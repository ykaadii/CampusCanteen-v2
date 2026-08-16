import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow any origin if CLIENT_URL is not strictly set or during production CORS handling
    if (!origin || !process.env.CLIENT_URL || process.env.CLIENT_URL === "*" || origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
});

// General API rate limit — generous, just to blunt abuse/scraping.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit specifically for auth routes — signup/login targets
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
