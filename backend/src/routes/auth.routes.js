import { Router } from "express";
import {
  signup,
  sendSignupOtp,
  verifyOtpAndSignup,
  updateDefaultCampus,
  login,
  me,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { authLimiter } from "../middleware/security.js";

const router = Router();

router.post("/send-otp", authLimiter, sendSignupOtp);
router.post("/verify-otp-signup", authLimiter, verifyOtpAndSignup);
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.patch("/default-campus", requireAuth, updateDefaultCampus);
router.get("/me", requireAuth, me);

export default router;
