import "./config/env.js";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import { createCrudRouter } from "./routes/crud.js";
import uploadRoutes from "./routes/uploads.js";
import contactRoutes from "./routes/contact.js";
import messageRoutes from "./routes/messages.js";
import { getMailerStatus } from "./utils/mailer.js";
import { getUploadDir } from "./middleware/upload.js";
import { getEngine } from "./config/store.js";
import { ensureInitialized } from "./init.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* Uploaded media lives here (see middleware/upload.js for the location rules). */
const UPLOAD_DIR = getUploadDir();

/* Built frontend, when it ships next to the API (single-deploy mode). */
const CLIENT_DIST = path.resolve(__dirname, "../../frontend/dist");

const app = express();

/* ------------------------------- CORS --------------------------------- */
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/**
 * Browser origins allowed to call this API.
 *
 * CLIENT_ORIGIN accepts a comma-separated list so the deployed frontend and
 * local development can be allowed at the same time; `*` wildcards cover
 * preview deployments:
 *   CLIENT_ORIGIN=https://mariette-portfolio.vercel.app,https://*.vercel.app
 */
const ALLOWED_ORIGINS = [
  ...new Set(
    [
      ...CLIENT_ORIGIN.split(","),
      "http://localhost:5173",
      "http://localhost:4173",
      "http://127.0.0.1:5173",
    ]
      .map((value) => value.trim().replace(/\/+$/, ""))
      .filter(Boolean)
  ),
];

function isAllowedOrigin(origin) {
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return ALLOWED_ORIGINS.some((allowed) => {
    if (!allowed.includes("*")) return false;
    const pattern = allowed
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^.]*");
    return new RegExp("^" + pattern + "$").test(origin);
  });
}

app.use(
  cors({
    origin(origin, callback) {
      /* Same-origin calls, curl and uptime/health checks send no Origin. */
      if (!origin || isAllowedOrigin(origin)) return callback(null, true);
      console.warn("[cors] Blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* Uploaded images are served from /uploads/... locally and from
   /api/uploads/... after the Vercel rewrite in server/vercel.json. */
app.use("/uploads", express.static(UPLOAD_DIR));
app.use("/api/uploads", express.static(UPLOAD_DIR));

/* ------------------------------- health -------------------------------- */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Portfolio API is running.",
    storage: getEngine(),
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

/* Diagnose contact-email delivery WITHOUT sending any email. */
app.get("/api/contact/status", (_req, res) => {
  res.json({ success: true, mailer: getMailerStatus() });
});

/* Boot once per process before the first data request (Firestore, SMTP, seed).
   Health checks above stay fast and keep working even if storage is down. */
app.use(async (_req, _res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

/* --------------------------------- API --------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", createCrudRouter("projects"));
app.use(
  "/api/skills",
  createCrudRouter("skills", {
    orderBy: { field: "name", direction: "asc" },
  })
);
app.use(
  "/api/experience",
  createCrudRouter("experience", {
    orderBy: { field: "startDate", direction: "desc" },
  })
);
app.use("/api/uploads", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/messages", messageRoutes);

/* Serve the built frontend when it ships next to the API (single-deploy mode
   on Render / a VPS / Docker: `npm run build` + `npm start`). */
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

/* -------------------------------- 404 ---------------------------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

/* ---------------------------- error handler ---------------------------- */
app.use((error, _req, res, _next) => {
  console.error("[error]", error);
  res
    .status(error.status || 500)
    .json({ success: false, message: error.message || "Server error." });
});

export default app;
export { ALLOWED_ORIGINS, UPLOAD_DIR, CLIENT_DIST };
