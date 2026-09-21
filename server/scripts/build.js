/**
 * Lightweight build step for the backend.
 *
 * The server is plain ESM JavaScript, so there is nothing to transpile.
 * This script:
 *   1. Recursively imports every source module (src/ + the Vercel function in
 *      api/) to catch syntax/import errors before a deploy.
 *   2. Copies server/ into server/dist (excluding node_modules, dist, data, uploads).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const API = path.join(ROOT, "api");
const DIST = path.join(ROOT, "dist");
const SERVER_ENTRY = path.join(SRC, "index.js");

const SKIP_DIRS = new Set(["node_modules", "dist", "data", "uploads", ".git"]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), files);
    } else if (entry.name.endsWith(".js")) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

async function run() {
  const files = [...walk(SRC), ...(fs.existsSync(API) ? walk(API) : [])];
  console.log(`[build] Checking ${files.length} server modules...`);

  let failures = 0;
  for (const file of files) {
    try {
      // The local entrypoint starts an HTTP listener, so only parse-check it.
      if (file === SERVER_ENTRY) {
        execFileSync(process.execPath, ["--check", file]);
        continue;
      }
      await import(pathToFileURL(file).href);
    } catch (error) {
      failures += 1;
      console.error(`[build] ERROR in ${path.relative(ROOT, file)}:`);
      console.error("        " + error.message);
    }
  }

  if (failures > 0) {
    console.error(`[build] Server build FAILED with ${failures} error(s).`);
    process.exit(1);
  }

  copyDir(ROOT, DIST);
  console.log("[build] Server modules OK.");
  console.log(`[build] Output written to ${path.relative(ROOT, DIST)}`);
}

run().catch((error) => {
  console.error("[build] Fatal:", error);
  process.exit(1);
});