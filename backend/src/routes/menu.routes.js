import { Router } from "express";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
} from "../controllers/menu.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

// Public / Authenticated read access
router.get("/canteen/:canteenId", requireAuth, getMenuItems);

// Staff / Owner / Admin item management (supports POST / and POST /canteen/:canteenId)
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  upload.single("image"),
  createMenuItem
);

router.post(
  "/canteen/:canteenId",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  upload.single("image"),
  createMenuItem
);

router.put(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  upload.single("image"),
  updateMenuItem
);

// Support both /:id/toggle and /:id/availability
router.patch(
  "/:id/toggle",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  toggleAvailability
);

router.patch(
  "/:id/availability",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  toggleAvailability
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "CANTEEN_STAFF", "CANTEEN_OWNER"),
  deleteMenuItem
);

export default router;
