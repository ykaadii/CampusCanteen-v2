import { Router } from "express";
import {
  getCanteens,
  getCanteenById,
  createCanteen,
  updateCanteen,
  deleteCanteen,
  assignStaff,
  removeStaff,
  assignOwner,
  removeOwner,
  getCanteenAnalytics,
} from "../controllers/canteen.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public / Authenticated read access
router.get("/", requireAuth, getCanteens);
router.get("/:id", requireAuth, getCanteenById);
router.get("/:id/analytics", requireAuth, requireRole("CANTEEN_OWNER", "ADMIN"), getCanteenAnalytics);

// Admin & Staff operations
router.post("/", requireAuth, requireRole("ADMIN"), upload.single("image"), createCanteen);
router.put("/:id", requireAuth, requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"), upload.single("image"), updateCanteen);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteCanteen);

// Staff management
router.post("/:id/staff", requireAuth, requireRole("ADMIN"), assignStaff);
router.delete("/:id/staff/:userId", requireAuth, requireRole("ADMIN"), removeStaff);

// Owner management
router.post("/:id/owner", requireAuth, requireRole("ADMIN"), assignOwner);
router.delete("/:id/owner/:userId", requireAuth, requireRole("ADMIN"), removeOwner);

export default router;
