/**
 * Entrypoint for local dev, Render, Docker, a VPS — and the file Vercel
 * auto-detects.
 *
 * Vercel ships zero-configuration Express support: it looks for `app`, `index`
 * or `server` at the project root or under `src/` (here `src/index.js`), turns
 * that file into a Node.js function and routes every request to it. The port
 * passed to listen() is ignored in that environment, so keeping both the
 * `listen()` call and the default export matches the supported detection paths.
 *
 * Importing app.js loads the environment (config/env.js), middleware and
 * routes; the one-time boot work (Firestore, SMTP, seeding) lives in init.js and
 * runs from the listen callback locally, or through the app middleware when the
 * file is used as a serverless function.
 */
import app, { ALLOWED_ORIGINS, UPLOAD_DIR } from "./app.js";
import { ensureInitialized } from "./init.js";

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  ensureInitialized()
    .then((engine) => {
      console.log("-----------------------------------------------");
      console.log(`  Portfolio API listening on ${HOST}:${PORT}`);
      console.log(`  Storage engine : ${engine}`);
      console.log(`  Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
      console.log(`  Uploads dir    : ${UPLOAD_DIR}`);
      console.log("  Admin login    : POST /api/auth/login");
      console.log("-----------------------------------------------");
    })
    .catch((error) => {
      console.error("[start] Initialization failed:", error.message);
    });
});

export default app;
