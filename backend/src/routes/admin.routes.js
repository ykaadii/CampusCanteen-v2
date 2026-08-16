import { Router } from "express";
import {
  getUsers,
  updateUserRole,
  updateFcmToken,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

router.patch("/fcm-token", requireAuth, updateFcmToken);
router.get("/users", requireAuth, requireRole("ADMIN"), getUsers);
router.patch("/users/:id/role", requireAuth, requireRole("ADMIN"), updateUserRole);

export default router;
