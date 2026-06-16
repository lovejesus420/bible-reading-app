import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, set, onValue, update } from 'firebase/database';

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  databaseURL: import.meta.env.VITE_FB_DB_URL,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

let _db = null;

function getDb() {
  if (_db) return _db;
  if (!config.databaseURL) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  _db = getDatabase(app);
  return _db;
}

export async function dbGet(path) {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await get(ref(db, path));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    console.error(`dbGet failed at ${path}:`, e);
    return null;
  }
}

export async function dbSet(path, value) {
  const db = getDb();
  if (!db) return;
  try {
    // If value is an object and path is not a leaf, we might want to use update
    // But set is fine if we want to overwrite. 
    // For records/name, we might want to merge.
    await set(ref(db, path), value);
  } catch (e) {
    console.error(`dbSet failed at ${path}:`, e);
  }
}

// Special helper for merging objects in RTDB
export async function dbUpdate(path, value) {
  const db = getDb();
  if (!db) return;
  try {
    await update(ref(db, path), value);
  } catch (e) {
    console.error(`dbUpdate failed at ${path}:`, e);
  }
}

export function dbListen(path, callback) {
  const db = getDb();
  if (!db) return () => {};
  return onValue(ref(db, path), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  }, (err) => {
    console.error(`dbListen failed at ${path}:`, err);
  });
}

export function isFirebaseEnabled() {
  return !!config.databaseURL;
}
