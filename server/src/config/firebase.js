import admin from "firebase-admin";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { setEngine, getEngine } from "./store.js";

// server/.env must be loaded before anything reads process.env.
// This module can be the first local import evaluated, so load it here with
// require() (ESM imports are hoisted and would run after the other imports).
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();
const DEFAULT_KEY_FILE = path.resolve(
  __dirname,
  "../../firebase-service-account.json"
);

let initialized = false;

/**
 * Resolve the service-account credentials, in order of priority:
 *   1. FIREBASE_SERVICE_ACCOUNT env var (inline JSON)
 *   2. FIREBASE_SERVICE_ACCOUNT_FILE (path to a JSON key file)
 *   3. server/firebase-service-account.json (default location)
 *
 * Returns null when none are found.
 */
function loadServiceAccount() {
  const inline = (process.env.FIREBASE_SERVICE_ACCOUNT || "").trim();
  if (inline) {
    try {
      return normalize(JSON.parse(inline));
    } catch {
      /* A malformed/truncated value must not disable Firestore: warn and keep
         looking (key file next), instead of aborting the whole lookup.
         The parse error is deliberately NOT logged — JSON.parse echoes the
         start of its input, which here is key material. */
      console.error(
        "[firebase] FIREBASE_SERVICE_ACCOUNT is not valid JSON " +
          `(${inline.length} characters) — ignoring it and checking the key file.`
      );
    }
  }

  const filePath =
    (process.env.FIREBASE_SERVICE_ACCOUNT_FILE || "").trim() ||
    DEFAULT_KEY_FILE;

  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      return normalize(parsed);
    } catch {
      /* Same reasoning as above: never echo key material into the logs. */
      console.error(
        `[firebase] Could not parse ${path.basename(filePath)} — ignoring it.`
      );
    }
  }

  return null;
}

function normalize(serviceAccount) {
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      "\n"
    );
  }
  return serviceAccount;
}

/**
 * Initialise Firebase Admin when credentials are available.
 * Otherwise fall back to the local JSON store so the API always works.
 */
export function initFirebase() {
  if (initialized) return getEngine();
  initialized = true;

  const forceLocal = String(process.env.USE_LOCAL_STORE || "")
    .toLowerCase()
    .trim();
  const useLocal =
    forceLocal === "true" || forceLocal === "1" || forceLocal === "yes";

  if (!useLocal) {
    try {
      const serviceAccount = loadServiceAccount();

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        const firestore = admin.firestore();
        setEngine("firestore", firestore);
        console.log(
          `[firebase] Connected to Firestore (project: ${serviceAccount.project_id}).`
        );
        return "firestore";
      }
    } catch (error) {
      console.error(
        "[firebase] Failed to initialise service account, using local store.",
        error.message
      );
      setEngine("local");
      return "local";
    }
  }

  setEngine("local");
  console.log(
    "[firebase] No service account found — using local JSON store (server/data/db.json)."
  );
  return "local";
}

export { admin };