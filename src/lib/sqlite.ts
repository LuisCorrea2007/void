/* ---------------------------------------------------------------------------
   SQLite engine layer
   - Real SQLite database compiled to WebAssembly (sql.js)
   - Database file persists across sessions inside IndexedDB
--------------------------------------------------------------------------- */
import type initSqlJsType from "sql.js";
import type { Database } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const IDB_NAME = "vltstrt";
const IDB_STORE = "sqlite";
const IDB_KEY = "store.db";

type SqlJsModule = typeof initSqlJsType;
let SQL: Awaited<ReturnType<SqlJsModule>> | null = null;

/* ------------------------- IndexedDB plumbing --------------------------- */
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(): Promise<Uint8Array | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve((req.result as Uint8Array) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(data: Uint8Array): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(data, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ----------------------------- engine API ------------------------------- */
export async function bootEngine(): Promise<Database> {
  if (!SQL) {
    /* dynamic import keeps the SQL engine out of the critical bundle */
    const mod = await import("sql.js");
    const initSqlJs = mod.default;
    SQL = await initSqlJs({ locateFile: () => wasmUrl });
  }
  const existing = await idbGet();
  return existing && existing.length > 0 ? new SQL.Database(existing) : new SQL.Database();
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write of the whole .db file back into IndexedDB */
export function persist(db: Database): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await idbPut(db.export());
    } catch (err) {
      console.error("[vltstrt] persist failed", err);
    }
  }, 250);
}

/** Synchronous export used for stats (size on disk) */
export function exportDB(db: Database): Uint8Array {
  return db.export();
}
