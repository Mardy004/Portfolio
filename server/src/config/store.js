import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.resolve(__dirname, "../../data");

/* Last-resort location for read-only filesystems (Vercel Functions). */
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), "portfolio-data");

let resolvedDataDir = null;

/**
 * Directory holding the local JSON store.
 *
 * Priority: DATA_DIR → server/data → a temp directory when the filesystem is
 * read-only (e.g. serverless functions). Resolved lazily so server/.env is
 * already loaded, then cached for the life of the process.
 */
function dataDir() {
  if (resolvedDataDir) return resolvedDataDir;

  const configured = (process.env.DATA_DIR || "").trim();
  const preferred = configured ? path.resolve(configured) : DEFAULT_DATA_DIR;

  resolvedDataDir = canWrite(preferred) ? preferred : FALLBACK_DATA_DIR;

  if (resolvedDataDir !== preferred) {
    console.warn(
      `[store] ${preferred} is not writable — using ${FALLBACK_DATA_DIR}. ` +
        "Content stored there is lost when the process is recycled; set " +
        "FIREBASE_SERVICE_ACCOUNT (or DATA_DIR on a persistent disk) to keep it."
    );
  }

  return resolvedDataDir;
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

function dbFile() {
  return path.join(dataDir(), "db.json");
}


/**
 * Two storage engines are supported:
 *  - "firestore" : real Firebase Firestore via firebase-admin
 *  - "local"     : a JSON file on disk (zero-config fallback)
 *
 * The correct engine is picked automatically in firebase.js and injected here.
 */
let engine = "local";
let firestore = null;

export function setEngine(nextEngine, firestoreDb = null) {
  engine = nextEngine;
  firestore = firestoreDb;
}

export function getEngine() {
  return engine;
}

/* ------------------------------------------------------------------ */
/*  Local JSON helpers                                                 */
/* ------------------------------------------------------------------ */

function ensureDataFile() {
  const dir = dataDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbFile())) {
    fs.writeFileSync(dbFile(), JSON.stringify({}, null, 2), "utf8");
  }
}

function readLocalDb() {
  ensureDataFile();
  try {
    return JSON.parse(fs.readFileSync(dbFile(), "utf8"));
  } catch {
    return {};
  }
}

function writeLocalDb(db) {
  ensureDataFile();
  fs.writeFileSync(dbFile(), JSON.stringify(db, null, 2), "utf8");
}

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  );
}

/* ------------------------------------------------------------------ */
/*  Public API — uniform across both engines                           */
/* ------------------------------------------------------------------ */

export async function list(collection, { orderBy } = {}) {
  if (engine === "firestore" && firestore) {
    let query = firestore.collection(collection);
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || "asc");
    }
    const snapshot = await query.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  const db = readLocalDb();
  const items = Object.values(db[collection] || {});
  if (orderBy) {
    const dir = orderBy.direction === "desc" ? -1 : 1;
    items.sort((a, b) => {
      const av = a[orderBy.field];
      const bv = b[orderBy.field];
      if (av === bv) return 0;
      return (av > bv ? 1 : -1) * dir;
    });
  }
  return items;
}

export async function getById(collection, id) {
  if (engine === "firestore" && firestore) {
    const doc = await firestore.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  const db = readLocalDb();
  const item = (db[collection] || {})[id];
  return item ? { id, ...item } : null;
}

export async function create(collection, data) {
  if (engine === "firestore" && firestore) {
    const payload = withTimestamps(data, true);
    const ref = await firestore.collection(collection).add(payload);
    return { id: ref.id, ...payload };
  }

  const db = readLocalDb();
  if (!db[collection]) db[collection] = {};
  const id = data.id || uid();
  const payload = withTimestamps({ ...data, id }, true);
  db[collection][id] = payload;
  writeLocalDb(db);
  return payload;
}

export async function update(collection, id, data) {
  if (engine === "firestore" && firestore) {
    const payload = withTimestamps(data, false);
    await firestore.collection(collection).doc(id).set(payload, {
      merge: true,
    });
    const doc = await firestore.collection(collection).doc(id).get();
    return { id, ...doc.data() };
  }

  const db = readLocalDb();
  if (!db[collection]) db[collection] = {};
  const existing = db[collection][id] || {};
  const payload = withTimestamps(
    { ...existing, ...data, id },
    false
  );
  db[collection][id] = payload;
  writeLocalDb(db);
  return payload;
}

export async function remove(collection, id) {
  if (engine === "firestore" && firestore) {
    await firestore.collection(collection).doc(id).delete();
    return true;
  }

  const db = readLocalDb();
  if (db[collection] && db[collection][id]) {
    delete db[collection][id];
    writeLocalDb(db);
    return true;
  }
  return false;
}

/**
 * Ensures a document with a known id exists (used for profile / admin).
 */
export async function ensureDoc(collection, id, data) {
  const existing = await getById(collection, id);
  if (existing) return existing;
  if (engine === "firestore" && firestore) {
    await firestore.collection(collection).doc(id).set(withTimestamps(data, true));
    return { id, ...data };
  }
  const db = readLocalDb();
  if (!db[collection]) db[collection] = {};
  db[collection][id] = withTimestamps({ ...data, id }, true);
  writeLocalDb(db);
  return db[collection][id];
}

function withTimestamps(data, isNew) {
  const now = new Date().toISOString();
  const out = { ...data };
  if (isNew) out.createdAt = out.createdAt || now;
  out.updatedAt = now;
  return out;
}