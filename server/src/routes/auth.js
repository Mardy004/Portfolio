import { Router } from "express";
import { getById, update } from "../config/store.js";
import {
  verifyPassword,
  hashPassword,
  signToken,
  requireAuth,
} from "../utils/auth.js";

const router = Router();

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required." });
  }

  const admin = await getById("admins", "primary");

  if (
    !admin ||
    admin.username !== username ||
    !verifyPassword(password, admin.passwordHash)
  ) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials." });
  }

  const token = signToken({
    sub: "primary",
    username: admin.username,
    role: admin.role || "admin",
    name: admin.displayName || admin.username,
  });

  return res.json({
    success: true,
    token,
    user: {
      username: admin.username,
      name: admin.displayName || admin.username,
      role: admin.role || "admin",
    },
  });
});

/**
 * GET /api/auth/me  (protected)
 */
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    success: true,
    user: {
      username: req.admin.username,
      name: req.admin.name,
      role: req.admin.role,
    },
  });
});

/**
 * PUT /api/auth/credentials  (protected)
 * Body: { currentPassword, newUsername?, newPassword? }
 */
router.put("/credentials", requireAuth, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body || {};
  const admin = await getById("admins", "primary");

  if (!admin || !verifyPassword(currentPassword, admin.passwordHash)) {
    return res
      .status(401)
      .json({ success: false, message: "Current password is incorrect." });
  }

  const patch = {};
  if (newUsername) patch.username = newUsername;
  if (newPassword) patch.passwordHash = hashPassword(newPassword);

  if (Object.keys(patch).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Nothing to update." });
  }

  await update("admins", "primary", patch);
  return res.json({ success: true, message: "Credentials updated." });
});

export default router;