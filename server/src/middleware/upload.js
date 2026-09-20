import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

/**
 * Directory where uploaded images are written (default: server/uploads).
 *
 * Set UPLOAD_DIR to a mounted persistent disk (e.g. /var/data/uploads) on hosts
 * with an ephemeral filesystem, otherwise uploads disappear on every deploy.
 * Resolved lazily so server/.env is already loaded when it is read.
 */
export function getUploadDir() {
  const configured = (process.env.UPLOAD_DIR || "").trim();
  const dir = configured ? path.resolve(configured) : DEFAULT_UPLOAD_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export { DEFAULT_UPLOAD_DIR };