import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  getDocs
} from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
};

let _db = null;

function getDb() {
  if (_db) return _db;
  if (!config.projectId) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  _db = getFirestore(app);
  return _db;
}

const unwrap = (data) => {
  if (data && typeof data === 'object' && '_v' in data) return data._v;
  return data;
};

const wrap = (val) => {
  if (Array.isArray(val) || typeof val !== 'object' || val === null) return { _v: val };
  return val;
};

export async function dbGet(path) {
  const db = getDb();
  if (!db) return null;
  
  try {
    const parts = path.split('/');
    if (parts.length % 2 === 0) {
      const snap = await getDoc(doc(db, ...parts));
      return snap.exists() ? unwrap(snap.data()) : null;
    } else {
      const snap = await getDocs(collection(db, ...parts));
      const out = {};
      snap.forEach(d => { out[d.id] = unwrap(d.data()); });
      return out;
    }
  } catch (e) {
    console.error('dbGet failed:', e);
    return null;
  }
}

export async function dbSet(path, value) {
  const db = getDb();
  if (!db) return;
  
  try {
    const parts = path.split('/');
    // Special handling for deep paths like records/user/date
    if (parts[0] === 'records' && parts.length === 3) {
      const [_, username, dateStr] = parts;
      await setDoc(doc(db, 'records', username), { [dateStr]: value }, { merge: true });
    } else if (parts.length % 2 === 0) {
      await setDoc(doc(db, ...parts), wrap(value), { merge: true });
    } else {
      console.warn('Unsupported dbSet path format:', path);
    }
  } catch (e) {
    console.error('dbSet failed:', e);
  }
}

export function dbListen(path, callback) {
  const db = getDb();
  if (!db) return () => {};
  
  try {
    const parts = path.split('/');
    if (parts.length % 2 === 0) {
      return onSnapshot(doc(db, ...parts), (snap) => {
        callback(snap.exists() ? unwrap(snap.data()) : null);
      }, (err) => {
        console.error(`Listen failed at ${path}:`, err);
      });
    } else {
      return onSnapshot(collection(db, ...parts), (snap) => {
        const out = {};
        snap.forEach(d => { out[d.id] = unwrap(d.data()); });
        callback(Object.keys(out).length ? out : null);
      }, (err) => {
        console.error(`Listen failed at ${path}:`, err);
      });
    }
  } catch (e) {
    console.error('dbListen setup failed:', e);
    return () => {};
  }
}

export function isFirebaseEnabled() {
  return !!config.projectId;
}
