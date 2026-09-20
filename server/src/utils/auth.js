import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "change_this_development_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "12h";

/* ------------------------------------------------------------------ */
/*  Password hashing (scrypt, no external dependency)                  */
/* ------------------------------------------------------------------ */

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;

  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  const derived = crypto.scryptSync(password, salt, 64).toString("hex");

  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/*  JWT                                                                */
/* ------------------------------------------------------------------ */

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware protecting admin-only endpoints.
 * Expects: Authorization: Bearer <token>
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  try {
    const decoded = verifyToken(token);
    req.admin = decoded;
    return next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired session." });
  }
}