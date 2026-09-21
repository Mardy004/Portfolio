/**
 * Local, Render, Docker and VPS entrypoint for the portfolio API.
 *
 * On Vercel the API is served by the serverless function in api/index.js
 * (wired up by server/vercel.json) — this file is still shipped there because
 * Vercel's Express detection looks for an app export or a listen() call, and
 * the port passed to listen() is ignored in that environment.
 *
 * Importing app.js loads the environment (config/env.js), middleware and
 * routes; the one-time boot work (Firestore, SMTP, seeding) lives in init.js.
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
