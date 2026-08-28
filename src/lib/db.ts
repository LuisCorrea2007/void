/* ---------------------------------------------------------------------------
   VLT/STRT — client-side database
   Persistent (localStorage), typed, and reactive via useSyncExternalStore.

   Collections:
     - stock:       variant-level inventory (size for clothing, closure for caps)
     - orders:      placed orders with a PENDING → CONFIRMED → SHIPPED → DELIVERED flow
     - subscribers: newsletter emails
     - wishlist:    saved product ids
--------------------------------------------------------------------------- */
import { useSyncExternalStore } from "react";
import type { CartLine, ColorOpt } from "../data/products";

export type OrderStatus = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED";
export const ORDER_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

export type OrderItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  color: ColorOpt;
  size?: string;
  closure?: string;
};

export type Order = {
  id: string;
  createdAt: number;
  status: OrderStatus;
  payment: "cod" | "transfer";
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: { name: string; whatsapp: string; address: string };
};

export type Subscriber = { email: string; at: number };

type DBShape = {
  v: number;
  stock: Record<string, Record<string, number>>;
  orders: Order[];
  subscribers: Subscriber[];
  wishlist: string[];
};

/* ------------------------------ seed data ------------------------------- */

/* Variant key = size (S–XL) for clothing, closure name for caps */
const SEED_STOCK: Record<string, Record<string, number>> = {
  p1: { Snapback: 14, Strapback: 9 },
  p2: { Snapback: 6, Strapback: 4 },
  p3: { Strapback: 11, Snapback: 7 },
  p4: { S: 8, M: 12, L: 5, XL: 3 },
  p5: { S: 0, M: 4, L: 2, XL: 1 }, // Graffiti tee: some sizes already gone
  p6: { S: 10, M: 14, L: 9, XL: 6 },
  p7: { S: 5, M: 7, L: 2, XL: 4 }, // Midnight hoodie L running low
  p8: { S: 6, M: 8, L: 5, XL: 3 },
};

const DB_KEY = "vltstrt_db_v1";
const VERSION = 1;

const seed = (): DBShape => ({
  v: VERSION,
  stock: JSON.parse(JSON.stringify(SEED_STOCK)),
  orders: [],
  subscribers: [],
  wishlist: [],
});

/* --------------------------- load / persist ----------------------------- */

function load(): DBShape {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as DBShape;
    if (parsed.v !== VERSION) return seed();
    return parsed;
  } catch {
    return seed();
  }
}

let cache: DBShape = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(cache));
  } catch {
    /* storage full / private mode — keep running in-memory */
  }
}

function commit(mutate: (draft: DBShape) => void) {
  const draft: DBShape = JSON.parse(JSON.stringify(cache));
  mutate(draft);
  cache = draft;
  persist();
  listeners.forEach((l) => l());
}

/* --------------------------- reactive hook ------------------------------ */

export function useDB(): DBShape {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
  );
}

/* ------------------------------ stock API ------------------------------- */

export const variantOf = (l: { size?: string; closure?: string }) =>
  l.size ?? l.closure ?? "default";

export const totalStock = (stock: Record<string, Record<string, number>>, productId: string) =>
  Object.values(stock[productId] ?? {}).reduce((n, q) => n + q, 0);

export const variantStock = (
  stock: Record<string, Record<string, number>>,
  productId: string,
  variant: string,
) => stock[productId]?.[variant] ?? 0;

function decrement(draft: DBShape, productId: string, variant: string, qty: number) {
  const map = (draft.stock[productId] ??= {});
  map[variant] = Math.max(0, (map[variant] ?? 0) - qty);
}

/* ------------------------------ orders API ------------------------------ */

export type NewOrderInput = {
  items: CartLine[];
  subtotal: number;
  shipping: number;
  total: number;
  payment: "cod" | "transfer";
  customer: { name: string; whatsapp: string; address: string };
};

export function createOrder(input: NewOrderInput): Order {
  const order: Order = {
    id: `VLT-${Date.now().toString(36).toUpperCase().slice(-6)}`,
    createdAt: Date.now(),
    status: "PENDING",
    payment: input.payment,
    items: input.items.map((l) => ({
      productId: l.productId,
      name: l.name,
      image: l.image,
      price: l.price,
      qty: l.qty,
      color: l.color,
      size: l.size,
      closure: l.closure,
    })),
    subtotal: input.subtotal,
    shipping: input.shipping,
    total: input.total,
    customer: input.customer,
  };
  commit((draft) => {
    draft.orders.unshift(order);
    order.items.forEach((it) =>
      decrement(draft, it.productId, variantOf(it), it.qty),
    );
  });
  return order;
}

export function advanceOrderStatus(orderId: string) {
  commit((draft) => {
    const o = draft.orders.find((x) => x.id === orderId);
    if (!o) return;
    const i = ORDER_FLOW.indexOf(o.status);
    if (i < ORDER_FLOW.length - 1) o.status = ORDER_FLOW[i + 1];
  });
}

/* ----------------------------- wishlist API ----------------------------- */

export function toggleWishlist(productId: string): boolean {
  let saved = false;
  commit((draft) => {
    const i = draft.wishlist.indexOf(productId);
    if (i >= 0) draft.wishlist.splice(i, 1);
    else {
      draft.wishlist.push(productId);
      saved = true;
    }
  });
  return saved;
}

/* ---------------------------- subscribers API --------------------------- */

export function subscribeEmail(email: string): "added" | "exists" {
  const clean = email.trim().toLowerCase();
  if (cache.subscribers.some((s) => s.email === clean)) return "exists";
  commit((draft) => {
    draft.subscribers.push({ email: clean, at: Date.now() });
  });
  return "added";
}

/* ------------------------------- utilities ------------------------------ */

export function resetDB() {
  cache = seed();
  persist();
  listeners.forEach((l) => l());
}
