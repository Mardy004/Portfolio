import { initFirebase } from "./config/firebase.js";
import { initMailer } from "./utils/mailer.js";
import { seedDatabase } from "./config/seed.js";

let initialization = null;

/**
 * Boot-time work, executed exactly once per process:
 *   1. connect to Firestore (or fall back to the local JSON store)
 *   2. build the Nodemailer (SMTP) transporter
 *   3. seed default content so the site is never empty
 *
 * Local/Render/Docker runs call this from the listen() callback; serverless
 * hosts (Vercel) call it lazily through the app's middleware, because a single
 * function instance may serve many requests before being recycled.
 */
export function ensureInitialized() {
  if (!initialization) {
    initialization = boot();
  }
  return initialization;
}

async function boot() {
  const engine = initFirebase();
  initMailer();

  try {
    await seedDatabase();
  } catch (error) {
    console.error("[seed] Skipped:", error.message);
  }

  if (engine === "local" && process.env.NODE_ENV === "production") {
    console.warn(
      "[storage] WARNING: production is using the local JSON store. On hosts " +
        "with an ephemeral filesystem, content resets whenever the process is " +
        "recycled — set FIREBASE_SERVICE_ACCOUNT or point DATA_DIR at a " +
        "persistent location."
    );
  }

  console.log(`[start] Ready — storage engine: ${engine}.`);
  return engine;
}
