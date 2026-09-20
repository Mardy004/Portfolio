import { Router } from "express";
import { list, getById, create, update, remove } from "../config/store.js";
import { requireAuth } from "../utils/auth.js";

/**
 * Builds a REST router for a collection.
 *
 *   GET    /            -> public list
 *   GET    /:id         -> public single
 *   POST   /            -> protected create
 *   PUT    /:id         -> protected update
 *   DELETE /:id         -> protected delete
 *
 * @param {string} collection  Firestore/local collection name
 * @param {object} options     { orderBy, sanitize }
 */
export function createCrudRouter(collection, options = {}) {
  const router = Router();
  const { orderBy, sanitize } = options;

  router.get("/", async (_req, res) => {
    try {
      const items = await list(collection, orderBy ? { orderBy } : {});
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const item = await getById(collection, req.params.id);
      if (!item) {
        return res
          .status(404)
          .json({ success: false, message: "Not found." });
      }
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  router.post("/", requireAuth, async (req, res) => {
    try {
      const payload = sanitize ? sanitize(req.body) : req.body;
      const created = await create(collection, payload);
      res.status(201).json({ success: true, data: created });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  router.put("/:id", requireAuth, async (req, res) => {
    try {
      const payload = sanitize ? sanitize(req.body) : req.body;
      const updated = await update(collection, req.params.id, payload);
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  router.delete("/:id", requireAuth, async (req, res) => {
    try {
      await remove(collection, req.params.id);
      res.json({ success: true, message: "Deleted." });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  return router;
}