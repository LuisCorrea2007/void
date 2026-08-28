import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import Catalog, { type SortKey } from "./components/Catalog";
import ProductModal, { type Selection } from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import OrdersDrawer from "./components/OrdersDrawer";
import { CapBanner, LedgerStrip, Newsletter } from "./components/Extras";
import Footer from "./components/Footer";
import { IconBag, IconBolt } from "./components/icons";
import {
  STORE,
  TICKER_ITEMS,
  fmt,
  productById,
  type CartLine,
  type Category,
  type Product,
} from "./data/products";
import {
  advanceOrderStatus,
  createOrder,
  toggleWishlist,
  useDB,
  variantOf,
  variantStock,
  type Order,
} from "./lib/db";

const CART_KEY = "vltstrt_cart_v1";

/* cart survives refreshes — same local database philosophy as the rest */
function loadCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((l) => l && l.key && l.productId) : [];
  } catch {
    return [];
  }
}

type Toast = { id: number; title: string; sub: string };

export default function App() {
  /* ------------------------- database (reactive) ------------------------- */
  const db = useDB();

  /* ------------------------------ store state ---------------------------- */
  const [lines, setLines] = useState<CartLine[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [savedOnly, setSavedOnly] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bumpKey, setBumpKey] = useState(0);
  const catalogRef = useRef<HTMLElement>(null);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.price * l.qty, 0), [lines]);

  /* --------------------------- toasts + nav ------------------------------ */
  const pushToast = useCallback((title: string, sub: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, sub }]);
  }, []);

  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback(
    (cat: Category | "all") => {
      setFilter(cat);
      setSavedOnly(false);
      scrollToCatalog();
    },
    [scrollToCatalog],
  );

  /* ------------------------- cart <-> stock sync -------------------------- */
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines]);

  /* on load: clamp saved cart against live inventory */
  useEffect(() => {
    const next = lines.flatMap((l) => {
      const p = productById(l.productId);
      if (!p) return [];
      const have = variantStock(db.stock, p.id, variantOf(l));
      if (have <= 0) return [];
      return l.qty > have ? [{ ...l, qty: have }] : [l];
    });
    if (JSON.stringify(next) !== JSON.stringify(lines)) {
      setLines(next);
      pushToast("Stock updated", "Your saved cart was adjusted to live inventory.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- cart ops ------------------------------ */
  const addToCart = useCallback(
    (p: Product, sel: Selection, silent = false): number => {
      const variant = variantOf(sel);
      const have = variantStock(db.stock, p.id, variant);
      const key = `${p.id}|${sel.color.name}|${sel.size ?? ""}|${sel.closure ?? ""}`;
      const existing = lines.find((l) => l.key === key)?.qty ?? 0;
      const room = have - existing;
      if (room <= 0) {
        if (!silent) pushToast("No more stock", `${p.name} — ${variant} is sold out.`);
        return 0;
      }
      const add = Math.min(sel.qty, room);
      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + add } : l));
        return [
          ...prev,
          {
            key,
            productId: p.id,
            name: p.name,
            image: p.image,
            price: p.price,
            color: sel.color,
            size: sel.size,
            closure: sel.closure,
            qty: add,
          },
        ];
      });
      setBumpKey((k) => k + 1);
      if (!silent) {
        const label = [sel.color.name, sel.size, sel.closure].filter(Boolean).join(" · ");
        pushToast(
          add < sel.qty ? `Only ${add} added — stock limit` : `Added to cart ×${add}`,
          `${p.name} — ${label}`,
        );
      }
      setActive(null);
      return add;
    },
    [db.stock, lines, pushToast],
  );

  /* quick add from card: clothing needs a size → modal; caps add directly */
  const quickAdd = useCallback(
    (p: Product) => {
      if (p.sizes) {
        setActive(p);
        return;
      }
      const variant = (p.closures ?? ["default"]).find((c) => variantStock(db.stock, p.id, c) > 0);
      if (!variant) {
        pushToast("Sold out", `${p.name} has no units left.`);
        return;
      }
      addToCart(p, { color: p.colors[0], closure: variant === "default" ? undefined : variant, qty: 1 });
    },
    [db.stock, addToCart, pushToast],
  );

  const updateQty = useCallback(
    (key: string, delta: number) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== key) return l;
          const have = Math.max(1, variantStock(db.stock, l.productId, variantOf(l)));
          return { ...l, qty: Math.max(1, Math.min(have, l.qty + delta)) };
        }),
      );
    },
    [db.stock],
  );

  const maxQty = useCallback(
    (l: CartLine) => Math.max(1, variantStock(db.stock, l.productId, variantOf(l))),
    [db.stock],
  );

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  /* ------------------------------ wishlist ------------------------------- */
  const toggleWish = useCallback(
    (p: Product) => {
      const saved = toggleWishlist(p.id);
      pushToast(saved ? "Saved to wishlist" : "Removed from wishlist", p.name);
    },
    [pushToast],
  );

  /* ------------------------------ checkout -------------------------------- */
  const placeOrder = useCallback(
    (customer: { name: string; whatsapp: string; address: string }, payment: "cod" | "transfer"): Order => {
      const sub = lines.reduce((n, l) => n + l.price * l.qty, 0);
      const shipping = sub >= STORE.freeShipThreshold ? 0 : STORE.flatShip;
      const order = createOrder({
        items: lines,
        subtotal: sub,
        shipping,
        total: sub + shipping,
        payment,
        customer,
      });
      setLines([]);
      pushToast("Order created", `${order.id} saved — inventory updated.`);
      return order;
    },
    [lines, pushToast],
  );

  const finishCheckout = useCallback(() => {
    setCheckoutOpen(false);
    pushToast("Order sent", "We'll confirm on WhatsApp shortly.");
  }, [pushToast]);

  /* ------------------------------ orders ---------------------------------- */
  const advance = useCallback(
    (id: string) => {
      advanceOrderStatus(id);
      pushToast("Status updated", `${id} moved to the next step.`);
    },
    [pushToast],
  );

  const reorder = useCallback(
    (o: Order) => {
      let added = 0;
      let skipped = 0;
      o.items.forEach((it) => {
        const p = productById(it.productId);
        if (!p) {
          skipped += it.qty;
          return;
        }
        const got = addToCart(p, { color: it.color, size: it.size, closure: it.closure, qty: it.qty }, true);
        added += got;
        if (got < it.qty) skipped += it.qty - got;
      });
      if (added > 0) {
        setOrdersOpen(false);
        setCartOpen(true);
        setBumpKey((k) => k + 1);
      }
      pushToast(
        added > 0 ? `Reordered ×${added}` : "Nothing available",
        skipped > 0 ? `${skipped} unit${skipped > 1 ? "s" : ""} skipped — out of stock now` : "All items back in your cart.",
      );
    },
    [addToCart, pushToast],
  );

  /* -------------------- overlays: escape + scroll lock -------------------- */
  const anyOverlay = cartOpen || checkoutOpen || ordersOpen || active !== null;

  useEffect(() => {
    document.body.style.overflow = anyOverlay ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [anyOverlay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (checkoutOpen) setCheckoutOpen(false);
      else if (active) setActive(null);
      else if (ordersOpen) setOrdersOpen(false);
      else if (cartOpen) setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkoutOpen, active, ordersOpen, cartOpen]);

  const startCheckout = () => {
    if (lines.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  /* -------------------------------- render -------------------------------- */
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Ticker items={TICKER_ITEMS} />
      <Navbar
        cartCount={count}
        bumpKey={bumpKey}
        ordersCount={db.orders.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onNav={handleNav}
        onOpenProduct={setActive}
      />

      <main>
        <Hero onShopNow={() => handleNav("all")} onCaps={() => handleNav("caps")} />
        <Ticker items={TICKER_ITEMS} reverse accent />
        <Catalog
          sectionRef={catalogRef}
          filter={filter}
          sort={sort}
          stock={db.stock}
          wishlist={db.wishlist}
          savedOnly={savedOnly}
          onFilter={setFilter}
          onSort={setSort}
          onToggleSaved={() => setSavedOnly((v) => !v)}
          onOpen={setActive}
          onQuickAdd={quickAdd}
          onToggleWish={toggleWish}
        />
        <CapBanner onCaps={() => handleNav("caps")} />
        <LedgerStrip />
        <Newsletter />
      </main>

      <Footer onNav={handleNav} />

      {/* ------------------------------ overlays ---------------------------- */}
      <CartDrawer
        open={cartOpen}
        lines={lines}
        subtotal={subtotal}
        maxQty={maxQty}
        onClose={() => setCartOpen(false)}
        onQty={updateQty}
        onRemove={removeLine}
        onCheckout={startCheckout}
        onBrowse={() => {
          setCartOpen(false);
          setTimeout(scrollToCatalog, 150);
        }}
      />

      <OrdersDrawer
        open={ordersOpen}
        orders={db.orders}
        onClose={() => setOrdersOpen(false)}
        onAdvance={advance}
        onReorder={reorder}
        onBrowse={() => {
          setOrdersOpen(false);
          setTimeout(scrollToCatalog, 150);
        }}
      />

      {active && (
        <ProductModal
          product={active}
          stock={db.stock[active.id] ?? {}}
          onClose={() => setActive(null)}
          onAdd={addToCart}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal
          lines={lines}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onComplete={finishCheckout}
          onPlace={placeOrder}
          onShowOrders={() => {
            setCheckoutOpen(false);
            setOrdersOpen(true);
          }}
        />
      )}

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-20 left-4 z-[85] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6 md:left-6">
        {toasts.map((t) => (
          <ToastCard
            key={t.id}
            toast={t}
            onView={() => {
              setToasts((prev) => prev.filter((x) => x.id !== t.id));
              setCartOpen(true);
            }}
            onDismiss={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>

      {/* mobile quick-cart bar */}
      {count > 0 && !cartOpen && !checkoutOpen && !ordersOpen && !active && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-volt/40 bg-ink/95 p-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between bg-volt px-5 py-3.5 text-ink transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.16em]">
              <IconBag className="w-4 h-4" />
              View cart · {count} {count === 1 ? "item" : "items"}
            </span>
            <span className="font-display text-xl">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* film grain over everything */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[90] opacity-[0.05]" />
    </div>
  );
}

/* ------------------------------- toast card ------------------------------ */
function ToastCard({
  toast,
  onView,
  onDismiss,
}: {
  toast: Toast;
  onView: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={onView}
      className="pointer-events-auto animate-toast-in flex w-full items-center gap-3 border border-seam border-l-4 border-l-volt bg-coal px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.6)] transition-colors hover:border-volt/60"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center bg-volt/15 text-volt">
        <IconBolt className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold uppercase tracking-wide">{toast.title}</span>
        <span className="block truncate text-[12px] text-ash">{toast.sub}</span>
      </span>
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-volt">View</span>
    </button>
  );
}
