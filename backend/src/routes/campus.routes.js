import { Router } from "express";
import {
  getCampuses,
  createCampus,
  updateCampus,
  deleteCampus,
} from "../controllers/campus.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// Public / Authenticated read access
router.get("/", requireAuth, getCampuses);

// Admin-only management
router.post("/", requireAuth, requireRole("ADMIN"), createCampus);
router.put("/:id", requireAuth, requireRole("ADMIN"), updateCampus);
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteCampus);

export default router;
