import { Router } from "express";
import { getById, update } from "../config/store.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * GET /api/profile  (public)
 */
router.get("/", async (_req, res) => {
  try {
    const profile = await getById("profile", "main");
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/profile  (protected)
 */
router.put("/", requireAuth, async (req, res) => {
  try {
    const updated = await update("profile", "main", req.body || {});
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;