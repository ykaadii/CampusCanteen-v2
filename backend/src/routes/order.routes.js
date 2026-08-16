import { Router } from "express";
import {
  createOrder,
  getStudentOrders,
  getCanteenOrders,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Student order routes
router.post("/", requireAuth, requireRole("STUDENT", "ADMIN"), createOrder);
router.get("/my", requireAuth, getStudentOrders);

// Staff order queue routes
router.get("/canteen/:canteenId", requireAuth, requireRole("CANTEEN_STAFF", "ADMIN"), getCanteenOrders);
router.patch("/:id/status", requireAuth, requireRole("CANTEEN_STAFF", "ADMIN"), updateOrderStatus);

export default router;
