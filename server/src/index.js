import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// NOTE: dotenv must run BEFORE any local module that reads process.env at
// import time (auth.js reads JWT_SECRET, firebase.js resolves credentials).
// ESM `import` statements are hoisted, so use require() for dotenv first.
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();
void dotenv;

import { initFirebase } from "./config/firebase.js";
import { seedDatabase } from "./config/seed.js";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import { createCrudRouter } from "./routes/crud.js";
import uploadRoutes from "./routes/uploads.js";
import contactRoutes from "./routes/contact.js";
import messageRoutes from "./routes/messages.js";
import { getMailerStatus, initMailer } from "./utils/mailer.js";
import { getUploadDir } from "./middleware/upload.js";
import { getEngine } from "./config/store.js";

const UPLOAD_DIR = getUploadDir();
const CLIENT_DIST = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* Bind to every interface by default so container hosts (Render, Railway,
   Fly, Docker) can reach the app. PORT is injected by those platforms. */
const HOST = process.env.HOST || "0.0.0.0";

/**
 * Browser origins allowed to call this API.
 *
 * CLIENT_ORIGIN accepts a comma-separated list, so the deployed frontend and
 * local development can both be allowed at the same time:
 *   CLIENT_ORIGIN=https://portfolio.vercel.app,https://www.example.com
 *
 * A `*` wildcard is supported for preview deployments:
 *   CLIENT_ORIGIN=https://*.vercel.app
 */
const ALLOWED_ORIGINS = [
  ...CLIENT_ORIGIN.split(","),
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
]
  .map((value) => value.trim().replace(/\/+$/, ""))
  .filter(Boolean);

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

/* ----------------------------- middleware ----------------------------- */
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

/* Allow the frontend to display uploaded images. */
app.use("/uploads", express.static(UPLOAD_DIR));

/* -------------------------------- health ------------------------------ */
app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Portfolio API is running.",
    storage: getEngine(),
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

/* Diagnose contact-email delivery WITHOUT sending any email.
   Open http://localhost:4000/api/contact/status in the browser. */
app.get("/api/contact/status", (_req, res) => {
  res.json({ success: true, mailer: getMailerStatus() });
});

/* --------------------------------- API -------------------------------- */
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

/* Serve the built frontend when it exists (single-deploy mode). */
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, "index.html"));
  });
}

/* ------------------------------- 404 ---------------------------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

/* ---------------------------- error handler --------------------------- */
app.use((error, _req, res, _next) => {
  console.error("[error]", error);
  res
    .status(error.status || 500)
    .json({ success: false, message: error.message || "Server error." });
});

/* ------------------------------- start -------------------------------- */
async function start() {
  const engine = initFirebase();
  initMailer();
  await seedDatabase();

  if (engine === "local" && process.env.NODE_ENV === "production") {
    console.warn(
      "[storage] WARNING: production is using the local JSON store. On hosts " +
        "with an ephemeral filesystem, content resets on every deploy — set " +
        "FIREBASE_SERVICE_ACCOUNT or point DATA_DIR at a persistent disk."
    );
  }

  app.listen(PORT, HOST, () => {
    console.log("-----------------------------------------------");
    console.log(`  Portfolio API listening on ${HOST}:${PORT}`);
    console.log(`  Storage engine : ${engine}`);
    console.log(`  Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
    console.log(`  Uploads dir    : ${UPLOAD_DIR}`);
    console.log(`  Admin login    : POST /api/auth/login`);
    console.log("-----------------------------------------------");
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
