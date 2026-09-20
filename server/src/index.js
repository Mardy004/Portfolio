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

const UPLOAD_DIR = path.resolve(__dirname, "../uploads");
const CLIENT_DIST = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

/* ----------------------------- middleware ----------------------------- */
app.use(
  cors({
    origin: [CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:4173"],
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

  app.listen(PORT, () => {
    console.log("-----------------------------------------------");
    console.log(`  Portfolio API listening on port ${PORT}`);
    console.log(`  Storage engine : ${engine}`);
    console.log(`  CORS origin    : ${CLIENT_ORIGIN}`);
    console.log(`  Admin login    : POST /api/auth/login`);
    console.log("-----------------------------------------------");
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
