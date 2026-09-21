import multer from "multer";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

/* Read-only filesystems (Vercel Functions) still allow writes to /tmp. */
const FALLBACK_UPLOAD_DIR = path.join(os.tmpdir(), "portfolio-uploads");

/* Vercel caps request bodies at 4.5 MB, so 4 MB is the safe default. Raise it
   via UPLOAD_MAX_MB on hosts that allow larger uploads (Render, Docker, VPS). */
const MAX_UPLOAD_MB = Number(process.env.UPLOAD_MAX_MB || 4) || 4;

let resolvedUploadDir = null;

/**
 * Directory where uploaded images are written.
 *
 * Priority: UPLOAD_DIR → server/uploads → a temp directory when the filesystem
 * is read-only. Resolved lazily so server/.env is already loaded, then cached.
 */
export function getUploadDir() {
  if (resolvedUploadDir) return resolvedUploadDir;

  const configured = (process.env.UPLOAD_DIR || "").trim();
  const preferred = configured ? path.resolve(configured) : DEFAULT_UPLOAD_DIR;

  resolvedUploadDir = canWrite(preferred) ? preferred : FALLBACK_UPLOAD_DIR;

  if (resolvedUploadDir !== preferred) {
    console.warn(
      `[uploads] ${preferred} is not writable — using ${FALLBACK_UPLOAD_DIR}. ` +
        "Uploaded files are lost when the process is recycled; set UPLOAD_DIR " +
        "to a mounted disk or host the images externally."
    );
  }

  return resolvedUploadDir;
}

function canWrite(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}


const allowed = /jpeg|jpg|png|webp|gif|svg/;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadDir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    cb(null, unique + ext);
  },
});

function fileFilter(_req, file, cb) {
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error("Only image files are allowed (jpg, png, webp, gif, svg)."));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
});

export { DEFAULT_UPLOAD_DIR };