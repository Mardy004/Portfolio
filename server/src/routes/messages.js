import { Router } from "express";
import { list, getById, update, remove } from "../config/store.js";
import { requireAuth } from "../utils/auth.js";

const router = Router();

/**
 * All message routes are admin-only.
 */
router.use(requireAuth);

/**
 * GET /api/messages  — list every contact message (newest first)
 */
router.get("/", async (_req, res) => {
  try {
    const items = await list("messages", {
      orderBy: { field: "createdAt", direction: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/messages/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await getById("messages", req.params.id);
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found." });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PATCH /api/messages/:id  — mark read/unread
 * Body: { read: boolean }
 */
router.patch("/:id", async (req, res) => {
  try {
    const updated = await update("messages", req.params.id, {
      read: Boolean(req.body?.read),
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/messages/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    await remove("messages", req.params.id);
    res.json({ success: true, message: "Message deleted." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;