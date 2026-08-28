/* ---------------------------------------------------------------------------
   VLT/STRT database layer
   A real SQLite database (WASM) persisted to IndexedDB.
   Every read/write below is an actual SQL statement — open the SQL console
   in the footer to watch them run.
--------------------------------------------------------------------------- */
import { useSyncExternalStore } from "react";
import { PRODUCTS, productById, STORE, type CartLine, type ColorOpt } from "../data/products";
import { bootEngine, exportDB, persist } from "./sqlite";
import type { Database, SqlValue } from "sql.js";

/* ------------------------------- types ---------------------------------- */
export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED";
export const ORDER_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  color: ColorOpt;
  size?: string;
  closure?: string;
  qty: number;
}
export interface Order {
  id: string;
  createdAt: number;
  status: OrderStatus;
  payment: "cod" | "transfer";
  customer: { name: string; whatsapp: string; address: string };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}
export interface Review {
  id: number;
  productId: string;
  name: string;
  rating: number;
  text: string;
  createdAt: number;
}

/* ------------------------------ internals ------------------------------- */
let db: Database | null = null;
let version = 0;
const listeners = new Set<() => void>();
const queryLog: { sql: string; t: number }[] = [];
const bootNotes: string[] = [];

function bump() {
  version++;
  listeners.forEach((l) => l());
}

function log(sql: string) {
  queryLog.unshift({ sql: sql.replace(/\s+/g, " ").trim(), t: Date.now() });
  if (queryLog.length > 60) queryLog.pop();
}

function run(sql: string, params: SqlValue[] = []) {
  if (!db) throw new Error("DB not ready");
  log(sql + (params.length ? `  -- [${params.join(", ")}]` : ""));
  db.run(sql, params);
  persist(db);
  bump();
}

function all<T = Record<string, SqlValue>>(sql: string, params: SqlValue[] = []): T[] {
  if (!db) throw new Error("DB not ready");
  log(sql + (params.length ? `  -- [${params.join(", ")}]` : ""));
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const out: T[] = [];
    while (stmt.step()) out.push(stmt.getAsObject() as T);
    return out;
  } finally {
    stmt.free();
  }
}

/* -------------------------------- schema -------------------------------- */
const SCHEMA = `
CREATE TABLE IF NOT EXISTS stock (
  product_id TEXT NOT NULL,
  variant    TEXT NOT NULL,
  units      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, variant)
);
CREATE TABLE IF NOT EXISTS cart (
  line_key   TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  image      TEXT NOT NULL,
  price      REAL NOT NULL,
  color_name TEXT NOT NULL,
  color_hex  TEXT NOT NULL,
  size       TEXT,
  closure    TEXT,
  qty        INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS orders (
  id         TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  status     TEXT NOT NULL,
  payment    TEXT NOT NULL,
  customer   TEXT NOT NULL,
  items      TEXT NOT NULL,
  subtotal   REAL NOT NULL,
  discount   REAL NOT NULL DEFAULT 0,
  shipping   REAL NOT NULL,
  total      REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS promos (
  code TEXT PRIMARY KEY,
  pct  INTEGER NOT NULL,
  note TEXT
);
CREATE TABLE IF NOT EXISTS subscribers (
  email      TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS wishlist (
  product_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  text       TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS restock_alerts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  email      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (product_id, email)
);`;

/* ------------------------------ seed data ------------------------------- */
const SEED_STOCK: Record<string, number> = {
  "p1|Snapback": 14, "p1|Strapback": 6,
  "p2|Snapback": 9,  "p2|Strapback": 0,
  "p3|Strapback": 11, "p3|Snapback": 4,
  "p4|S": 6, "p4|M": 9, "p4|L": 7, "p4|XL": 3,
  "p5|S": 0, "p5|M": 4, "p5|L": 2, "p5|XL": 0,
  "p6|S": 8, "p6|M": 0, "p6|L": 5, "p6|XL": 6,
  "p7|S": 5, "p7|M": 8, "p7|L": 4, "p7|XL": 2,
  "p8|S": 3, "p8|M": 6, "p8|L": 0, "p8|XL": 4,
};

const SEED_REVIEWS: Omit<Review, "createdAt">[] = [
  { id: 1, productId: "p1", name: "Maya R.", rating: 5, text: "Brim is stiff, snap is crisp. The volt hits different IRL." },
  { id: 2, productId: "p1", name: "Dre", rating: 4, text: "Fits perfect and the sweatband actually works in summer." },
  { id: 3, productId: "p2", name: "Kofi", rating: 5, text: "Got #117 of 200. This purple goes stupid hard under light." },
  { id: 4, productId: "p4", name: "Lena", rating: 5, text: "240gsm is no joke — zero shrink after ten washes." },
  { id: 5, productId: "p5", name: "Ana", rating: 5, text: "My acid wash came out unique. Compliments every single day." },
  { id: 6, productId: "p7", name: "Marco", rating: 4, text: "Heavy like armor. Sleeves run slightly long, size down if unsure." },
];

function seed() {
  db!.run(SCHEMA);
  for (const [key, units] of Object.entries(SEED_STOCK)) {
    const [pid, variant] = key.split("|");
    db!.run("INSERT OR IGNORE INTO stock (product_id, variant, units) VALUES (?, ?, ?)", [pid, variant, units]);
  }
  db!.run("INSERT OR IGNORE INTO promos (code, pct, note) VALUES ('STREET10', 10, 'Drop launch code')");
  db!.run("INSERT OR IGNORE INTO promos (code, pct, note) VALUES ('VOLT5', 5, 'Newsletter welcome code')");
  const now = Date.now();
  for (const r of SEED_REVIEWS) {
    db!.run("INSERT OR IGNORE INTO reviews (id, product_id, name, rating, text, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
      r.id, r.productId, r.name, r.rating, r.text, now - r.id * 86400000,
    ]);
  }
  log("schema created + drop 004 seeded");
}

/** Clamp cart rows to real stock (runs on every boot) */
function reconcileCart() {
  if (!db) return;
  const rows = all<{ line_key: string; qty: number }>("SELECT line_key, qty FROM cart");
  for (const row of rows) {
    const [pid, , size, closure] = row.line_key.split("|");
    const variant = size || closure || "";
    const left = all<{ units: number }>(
      "SELECT units FROM stock WHERE product_id = ? AND variant = ?", [pid, variant],
    )[0]?.units ?? 0;
    if (left === 0) {
      db.run("DELETE FROM cart WHERE line_key = ?", [row.line_key]);
      bootNotes.push("A cart item sold out while you were away — we removed it.");
    } else if (row.qty > left) {
      db.run("UPDATE cart SET qty = ? WHERE line_key = ?", [left, row.line_key]);
      bootNotes.push("Cart adjusted to match live stock.");
    }
  }
  if (bootNotes.length) { persist(db); bump(); }
}

/* --------------------------------- boot ---------------------------------- */
let readyPromise: Promise<void> | null = null;

export function initDB(): Promise<void> {
  if (!readyPromise) {
    readyPromise = bootEngine().then((engine) => {
      db = engine;
      seed();
      reconcileCart();
      bump();
    });
  }
  return readyPromise;
}

export function consumeBootNotes(): string[] {
  return bootNotes.splice(0, bootNotes.length);
}

/* ------------------------------ reactivity ------------------------------- */
export function useDB(): number {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => version,
    () => version,
  );
}

/* --------------------------------- stock --------------------------------- */
export function getStock(productId: string): Record<string, number> {
  const rows = all<{ variant: string; units: number }>(
    "SELECT variant, units FROM stock WHERE product_id = ? ORDER BY variant", [productId],
  );
  return Object.fromEntries(rows.map((r) => [r.variant, r.units]));
}

export function totalStock(stockMap: Record<string, Record<string, number>>, productId: string): number {
  return Object.values(stockMap[productId] ?? {}).reduce((a, b) => a + b, 0);
}

function variantOf(line: { productId: string; size?: string; closure?: string }) {
  return line.size || line.closure || "";
}
function unitsLeft(productId: string, variant: string): number {
  return all<{ units: number }>(
    "SELECT units FROM stock WHERE product_id = ? AND variant = ?", [productId, variant],
  )[0]?.units ?? 0;
}

/* ---------------------------------- cart --------------------------------- */
export function getCart(): CartLine[] {
  return all<{
    line_key: string; product_id: string; name: string; image: string; price: number;
    color_name: string; color_hex: string; size: string | null; closure: string | null; qty: number;
  }>("SELECT * FROM cart ORDER BY rowid").map((r) => ({
    key: r.line_key,
    productId: r.product_id,
    name: r.name,
    image: r.image,
    price: r.price,
    color: { name: r.color_name, hex: r.color_hex },
    size: r.size ?? undefined,
    closure: r.closure ?? undefined,
    qty: r.qty,
  }));
}

export function addToCart(
  p: { id: string; name: string; image: string; price: number },
  sel: { color: ColorOpt; size?: string; closure?: string },
  qty: number,
): { ok: boolean; note: string } {
  const variant = sel.size ?? sel.closure ?? "";
  const left = unitsLeft(p.id, variant);
  if (left <= 0) return { ok: false, note: `Sold out — ${variant}` };
  const key = `${p.id}|${sel.color.name}|${sel.size ?? ""}|${sel.closure ?? ""}`;
  const current = all<{ qty: number }>("SELECT qty FROM cart WHERE line_key = ?", [key])[0]?.qty ?? 0;
  const next = Math.min(left, current + qty, 99);
  if (next === current) return { ok: false, note: `Only ${left} in stock for ${variant}` };
  run(
    `INSERT INTO cart (line_key, product_id, name, image, price, color_name, color_hex, size, closure, qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(line_key) DO UPDATE SET qty = ?`,
    [key, p.id, p.name, p.image, p.price, sel.color.name, sel.color.hex, sel.size ?? null, sel.closure ?? null, next, next],
  );
  return { ok: true, note: `${p.name} — ${[sel.color.name, sel.size, sel.closure].filter(Boolean).join(" · ")}` };
}

export function setCartQty(key: string, qty: number) {
  const [pid, , size, closure] = key.split("|");
  const left = unitsLeft(pid, size || closure || "");
  const next = Math.max(1, Math.min(qty, Math.max(1, left)));
  run("UPDATE cart SET qty = ? WHERE line_key = ?", [next, key]);
}

export function removeCartLine(key: string) {
  run("DELETE FROM cart WHERE line_key = ?", [key]);
}

/* --------------------------------- orders -------------------------------- */
export function getOrders(): Order[] {
  return all<{
    id: string; created_at: number; status: string; payment: string; customer: string;
    items: string; subtotal: number; discount: number; shipping: number; total: number;
  }>("SELECT * FROM orders ORDER BY created_at DESC").map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    status: r.status as OrderStatus,
    payment: r.payment as "cod" | "transfer",
    customer: JSON.parse(r.customer),
    items: JSON.parse(r.items),
    subtotal: r.subtotal,
    discount: r.discount,
    shipping: r.shipping,
    total: r.total,
  }));
}

export function placeOrder(
  items: OrderItem[],
  customer: Order["customer"],
  payment: "cod" | "transfer",
  discountPct: number,
): Order {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const discount = Math.round(subtotal * discountPct) / 100 * 100 / 100;
  const discounted = Math.round((subtotal - discount) * 100) / 100;
  const shipping = discounted >= STORE.freeShipThreshold ? 0 : STORE.flatShip;
  const order: Order = {
    id: `VLT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    createdAt: Date.now(),
    status: "PENDING",
    payment,
    customer,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping,
    total: Math.round((discounted + shipping) * 100) / 100,
  };
  /* decrement stock — this is the moment inventory moves */
  for (const it of items) {
    run(
      "UPDATE stock SET units = MAX(0, units - ?) WHERE product_id = ? AND variant = ?",
      [it.qty, it.productId, variantOf(it)],
    );
  }
  run(
    `INSERT INTO orders (id, created_at, status, payment, customer, items, subtotal, discount, shipping, total)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [order.id, order.createdAt, order.status, order.payment, JSON.stringify(customer),
     JSON.stringify(items), order.subtotal, order.discount, order.shipping, order.total],
  );
  run("DELETE FROM cart");
  return order;
}

export function advanceOrder(id: string) {
  const order = getOrders().find((o) => o.id === id);
  if (!order) return;
  const next = ORDER_FLOW[Math.min(ORDER_FLOW.indexOf(order.status) + 1, ORDER_FLOW.length - 1)];
  run("UPDATE orders SET status = ? WHERE id = ?", [next, id]);
}

/* --------------------------------- promos -------------------------------- */
export function validatePromo(code: string): { valid: boolean; pct: number; note: string } {
  const row = all<{ pct: number; note: string | null }>(
    "SELECT pct, note FROM promos WHERE code = ?", [code.trim().toUpperCase()],
  )[0];
  return row
    ? { valid: true, pct: row.pct, note: row.note ?? "" }
    : { valid: false, pct: 0, note: "Code not found in promos table" };
}

/* ------------------------------- subscribers ------------------------------ */
export function subscribeEmail(email: string): "added" | "exists" {
  const clean = email.trim().toLowerCase();
  const exists = all("SELECT 1 AS x FROM subscribers WHERE email = ?", [clean]).length > 0;
  if (exists) return "exists";
  run("INSERT INTO subscribers (email, created_at) VALUES (?, ?)", [clean, Date.now()]);
  return "added";
}

/* -------------------------------- wishlist ------------------------------- */
export function getWishlist(): string[] {
  return all<{ product_id: string }>("SELECT product_id FROM wishlist ORDER BY created_at").map((r) => r.product_id);
}

export function toggleWishlist(productId: string) {
  const saved = all("SELECT 1 AS x FROM wishlist WHERE product_id = ?", [productId]).length > 0;
  if (saved) run("DELETE FROM wishlist WHERE product_id = ?", [productId]);
  else run("INSERT INTO wishlist (product_id, created_at) VALUES (?, ?)", [productId, Date.now()]);
}

/* --------------------------------- reviews ------------------------------- */
export function getReviews(productId: string): Review[] {
  return all<{
    id: number; product_id: string; name: string; rating: number; text: string; created_at: number;
  }>(
    "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 30", [productId],
  ).map((r) => ({ id: r.id, productId: r.product_id, name: r.name, rating: r.rating, text: r.text, createdAt: r.created_at }));
}

export function addReview(productId: string, name: string, rating: number, text: string) {
  run("INSERT INTO reviews (product_id, name, rating, text, created_at) VALUES (?, ?, ?, ?, ?)", [
    productId, name.trim(), rating, text.trim(), Date.now(),
  ]);
}

export function getRating(productId: string): { avg: number; count: number } {
  const row = all<{ avg: number | null; count: number }>(
    "SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE product_id = ?", [productId],
  )[0];
  return { avg: row?.avg ? Math.round(row.avg * 10) / 10 : 0, count: row?.count ?? 0 };
}

/* ----------------------------- restock alerts ----------------------------- */
export function notifyRestock(productId: string, email: string): "added" | "exists" {
  const clean = email.trim().toLowerCase();
  const exists = all(
    "SELECT 1 AS x FROM restock_alerts WHERE product_id = ? AND email = ?", [productId, clean],
  ).length > 0;
  if (exists) return "exists";
  run("INSERT INTO restock_alerts (product_id, email, created_at) VALUES (?, ?, ?)", [productId, clean, Date.now()]);
  return "added";
}

/* ------------------------------ console / stats --------------------------- */
export function getQueryLog() {
  return [...queryLog];
}

export function getDBStats() {
  const tables = all<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  ).map((t) => t.name);
  const rows = tables.map((name) => ({
    name,
    rows: all<{ n: number }>(`SELECT COUNT(*) AS n FROM ${name}`)[0]?.n ?? 0,
  }));
  const sizeKB = db ? Math.round(exportDB(db).length / 102.4) / 10 : 0;
  return { tables: rows, sizeKB };
}

export function runConsoleSQL(sql: string): { kind: "rows"; columns: string[]; rows: SqlValue[][] } | { kind: "exec"; changes: string } {
  if (!db) throw new Error("DB not ready");
  const trimmed = sql.trim().replace(/;$/, "");
  log(`console> ${trimmed}`);
  if (/^(select|pragma|with|explain)/i.test(trimmed)) {
    const stmt = db.prepare(trimmed);
    try {
      const columns = stmt.getColumnNames();
      const rows: SqlValue[][] = [];
      while (stmt.step() && rows.length < 80) rows.push(stmt.get());
      return { kind: "rows", columns, rows };
    } finally {
      stmt.free();
    }
  }
  db.run(trimmed);
  persist(db);
  bump();
  return { kind: "exec", changes: "Statement executed — tables refreshed." };
}

/* --------------------------------- reset ---------------------------------- */
export function resetDB() {
  if (!db) return;
  db.run("DELETE FROM cart");
  db.run("DELETE FROM orders");
  db.run("DELETE FROM subscribers");
  db.run("DELETE FROM wishlist");
  db.run("DELETE FROM reviews");
  db.run("DELETE FROM restock_alerts");
  db.run("DELETE FROM stock");
  for (const [key, units] of Object.entries(SEED_STOCK)) {
    const [pid, variant] = key.split("|");
    db.run("INSERT INTO stock (product_id, variant, units) VALUES (?, ?, ?)", [pid, variant, units]);
  }
  const now = Date.now();
  for (const r of SEED_REVIEWS) {
    db.run("INSERT INTO reviews (id, product_id, name, rating, text, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
      r.id, r.productId, r.name, r.rating, r.text, now - r.id * 86400000,
    ]);
  }
  persist(db);
  bump();
}

/* ------------------------------- misc exports ----------------------------- */
export { productById, PRODUCTS };
