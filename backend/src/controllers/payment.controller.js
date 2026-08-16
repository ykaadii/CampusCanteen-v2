import crypto from "crypto";
import { prisma } from "../config/db.js";
import { razorpay } from "../config/razorpay.js";

async function verifyStaffAuthorization(userId, canteenId, userRole) {
  if (userRole === "ADMIN") return true;
  const assignment = await prisma.canteenStaff.findUnique({
    where: {
      userId_canteenId: { userId, canteenId },
    },
  });
  return Boolean(assignment);
}

export async function createRazorpayOrder(req, res, next) {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const amountInPaise = Math.round(Number(order.totalAmount) * 100);

    if (razorpay) {
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `receipt_${order.id.slice(-8)}`,
      });

      await prisma.payment.update({
        where: { orderId: order.id },
        data: { razorpayId: razorpayOrder.id },
      });

      return res.json({
        razorpayOrderId: razorpayOrder.id,
        amount: amountInPaise,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      });
    } else {
      // Dev mode fallback when Razorpay keys are not configured
      const mockRazorpayId = `order_mock_${Date.now()}`;
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { razorpayId: mockRazorpayId },
      });

      return res.json({
        razorpayOrderId: mockRazorpayId,
        amount: amountInPaise,
        currency: "INR",
        key: "rzp_test_mock",
        mock: true,
      });
    }
  } catch (err) {
    next(err);
  }
}

export async function verifyRazorpayPayment(req, res, next) {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    if (razorpay && process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        await prisma.payment.update({
          where: { orderId },
          data: { status: "FAILED" },
        });
        return res.status(400).json({ error: "Invalid payment signature" });
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { orderId },
      data: {
        status: "SUCCESS",
        razorpayId: razorpay_payment_id || payment.razorpayId,
      },
    });

    res.json({ payment: updatedPayment, message: "Payment verified successfully" });
  } catch (err) {
    next(err);
  }
}

export async function markCashPaid(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { canteenId: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Verify staff is authorized for this order's canteen
    const isAuthorized = await verifyStaffAuthorization(req.user.id, order.canteenId, req.user.role);
    if (!isAuthorized) {
      return res.status(403).json({ error: "You are not authorized to mark cash payments for this canteen" });
    }

    const updatedPayment = await prisma.payment.update({
      where: { orderId },
      data: { status: "SUCCESS" },
    });

    res.json({ payment: updatedPayment, message: "Payment marked as paid in cash" });
  } catch (err) {
    next(err);
  }
}
