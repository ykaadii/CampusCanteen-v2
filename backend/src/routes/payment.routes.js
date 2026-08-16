import { Router } from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  markCashPaid,
} from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/create-razorpay-order", requireAuth, createRazorpayOrder);
router.post("/verify-razorpay", requireAuth, verifyRazorpayPayment);
router.patch("/:orderId/cash-paid", requireAuth, requireRole("CANTEEN_STAFF", "ADMIN"), markCashPaid);

export default router;
