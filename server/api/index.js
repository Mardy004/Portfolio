/**
 * Vercel serverless entrypoint for the Express API.
 *
 * `server/vercel.json` rewrites every request to `/api/index/:path*`, so this
 * function receives URLs such as `/api/index/api/projects`. The internal prefix
 * is stripped again below so Express sees exactly the same URL it sees locally
 * (`/api/projects`). Should Vercel hand over the original path instead, the
 * check is a no-op and routing still works.
 *
 * All boot work (Firestore, SMTP, seeding) happens lazily through the app's own
 * middleware — see src/init.js — so no listen() is needed here.
 */
import app from "../src/app.js";

const INTERNAL_PREFIX = "/api/index";

function toPublicUrl(url) {
  if (typeof url !== "string" || !url.startsWith(INTERNAL_PREFIX)) return url;
  const rest = url.slice(INTERNAL_PREFIX.length);
  return rest.startsWith("/") ? rest : "/" + rest;
}

export default function handler(req, res) {
  req.url = toPublicUrl(req.url);
  return app(req, res);
}
