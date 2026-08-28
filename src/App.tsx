import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import Catalog, { type SortKey } from "./components/Catalog";
import ProductModal, { type Selection } from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import { CapBanner, LedgerStrip, Newsletter } from "./components/Extras";
import Footer from "./components/Footer";
import { IconBag, IconBolt } from "./components/icons";
import {
  STORE,
  TICKER_ITEMS,
  fmt,
  type CartLine,
  type Category,
  type Product,
} from "./data/products";

type Toast = { id: number; title: string; sub: string };

export default function App() {
  /* ------------------------------ store state --------------------------- */
  const [lines, setLines] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sort, setSort] = useState<SortKey>("featured");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bumpKey, setBumpKey] = useState(0);
  const catalogRef = useRef<HTMLElement>(null);

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((n, l) => n + l.price * l.qty, 0), [lines]);

  /* ------------------------------ navigation ---------------------------- */
  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback(
    (cat: Category | "all") => {
      setFilter(cat);
      scrollToCatalog();
    },
    [scrollToCatalog],
  );

  /* ------------------------------- cart ops ----------------------------- */
  const pushToast = useCallback((title: string, sub: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, sub }]);
  }, []);

  const addToCart = useCallback(
    (p: Product, sel: Selection) => {
      const key = `${p.id}|${sel.color.name}|${sel.size ?? ""}|${sel.closure ?? ""}`;
      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) {
          return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(9, l.qty + sel.qty) } : l));
        }
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
            qty: sel.qty,
          },
        ];
      });
      setBumpKey((k) => k + 1);
      const variant = [sel.color.name, sel.size, sel.closure].filter(Boolean).join(" · ");
      pushToast(`Added to cart ×${sel.qty}`, `${p.name} — ${variant}`);
      setActive(null);
    },
    [pushToast],
  );

  const updateQty = useCallback((key: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(9, l.qty + delta)) } : l))
        .filter(Boolean),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  /* -------------------- overlays: escape + scroll lock ------------------ */
  const anyOverlay = cartOpen || checkoutOpen || active !== null;

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
      else if (cartOpen) setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkoutOpen, active, cartOpen]);

  const startCheckout = () => {
    if (lines.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const finishCheckout = () => {
    setCheckoutOpen(false);
    setLines([]);
    pushToast("Order sent", "We'll confirm on WhatsApp shortly.");
  };

  /* -------------------------------- render ------------------------------ */
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Ticker items={TICKER_ITEMS} />
      <Navbar
        cartCount={count}
        bumpKey={bumpKey}
        onOpenCart={() => setCartOpen(true)}
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
          onFilter={setFilter}
          onSort={setSort}
          onOpen={setActive}
        />
        <CapBanner onCaps={() => handleNav("caps")} />
        <LedgerStrip />
        <Newsletter />
      </main>

      <Footer onNav={handleNav} />

      {/* ------------------------------ overlays --------------------------- */}
      <CartDrawer
        open={cartOpen}
        lines={lines}
        subtotal={subtotal}
        onClose={() => setCartOpen(false)}
        onQty={updateQty}
        onRemove={removeLine}
        onCheckout={startCheckout}
        onBrowse={() => {
          setCartOpen(false);
          setTimeout(scrollToCatalog, 150);
        }}
      />

      {active && (
        <ProductModal product={active} onClose={() => setActive(null)} onAdd={addToCart} />
      )}

      {checkoutOpen && lines.length > 0 && (
        <CheckoutModal
          lines={lines}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onComplete={finishCheckout}
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
      {count > 0 && !cartOpen && !checkoutOpen && !active && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-volt/40 bg-ink/95 p-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between bg-volt px-5 py-3.5 text-ink active:scale-[0.98] transition-transform"
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

/* ------------------------------- toast card ----------------------------- */
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
      <span className="min-w-0">
        <span className="block text-[13px] font-bold uppercase tracking-wide">{toast.title}</span>
        <span className="block truncate text-[12px] text-ash">{toast.sub}</span>
      </span>
      <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-volt">
        View
      </span>
    </button>
  );
}
