/**
 * Loads environment variables from server/.env (if present) plus the process
 * environment.
 *
 * Imported first by app.js / index.js so that every module which reads
 * process.env at import time (auth.js reads JWT_SECRET, firebase.js resolves
 * credentials, store.js/upload.js resolve storage paths) already sees the
 * values. On hosts like Vercel or Render there is no .env file — the platform
 * variables are simply used as-is.
 *
 * Uses require() because dotenv must run before the sibling ESM imports are
 * evaluated.
 */
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config();
