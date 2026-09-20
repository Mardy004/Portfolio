import { Router } from "express";
import { upload } from "../middleware/upload.js";
import { requireAuth } from "../utils/auth.js";
import { create, list, remove } from "../config/store.js";

const router = Router();

/**
 * POST /api/uploads  (protected, multipart/form-data, field name: "file")
 * Stores the image on disk and records metadata for the media library.
 */
router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (error) => {
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded." });
    }

    const url = "/uploads/" + req.file.filename;
    const record = await create("media", {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url,
    });

    return res.status(201).json({ success: true, data: record });
  });
});

/**
 * GET /api/uploads  (protected) — media library
 */
router.get("/", requireAuth, async (_req, res) => {
  try {
    const items = await list("media", {
      orderBy: { field: "createdAt", direction: "desc" },
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/uploads/:id  (protected) — remove metadata record
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await remove("media", req.params.id);
    res.json({ success: true, message: "Removed from library." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;