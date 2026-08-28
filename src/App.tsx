import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Ticker from "./components/Ticker";
import Hero from "./components/Hero";
import Catalog, { type SortKey } from "./components/Catalog";
import ProductModal, { type Selection } from "./components/ProductModal";
import CartDrawer from "./components/CartDrawer";
import OrdersDrawer from "./components/OrdersDrawer";
import CheckoutModal from "./components/CheckoutModal";
import DBConsole from "./components/DBConsole";
import StaffPanel from "./components/StaffPanel";
import BootScreen from "./components/BootScreen";
import { CapBanner, LedgerStrip, Newsletter } from "./components/Extras";
import Footer from "./components/Footer";
import { IconBag, IconBolt } from "./components/icons";
import { TICKER_ITEMS, fmt, type Category, type Product } from "./data/products";
import {
  addToCart as dbAddToCart,
  advanceOrder,
  consumeBootNotes,
  getCart,
  getOrders,
  getProducts,
  getStock,
  getWishlist,
  initDB,
  placeOrder,
  removeCartLine,
  setCartQty,
  toggleWishlist,
  useDB,
  type Order,
} from "./lib/db";

const CapLab = lazy(() => import("./components/CapLab"));

type Toast = { id: number; title: string; sub: string; kind: "ok" | "err" };

export default function App() {
  /* ------------------------------ arranque BD ----------------------------- */
  const [boot, setBoot] = useState<"booting" | "ready" | "error">("booting");
  const [bootError, setBootError] = useState("");

  const bootDB = useCallback(() => {
    setBoot("booting");
    initDB()
      .then(() => setBoot("ready"))
      .catch((e) => {
        console.error(e);
        setBootError(e?.message ?? "Error desconocido de la base de datos");
        setBoot("error");
      });
  }, []);

  useEffect(() => {
    bootDB();
  }, [bootDB]);

  /* ------------------------------ estado de UI ---------------------------- */
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [labPreset, setLabPreset] = useState<string | null>(null);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [bumpKey, setBumpKey] = useState(0);
  const catalogRef = useRef<HTMLElement>(null);

  /* --------------------------- snapshot vivo de la BD ---------------------- */
  const dbv = useDB();
  const cart = useMemo(() => (boot === "ready" ? getCart() : []), [boot, dbv]);
  const orders = useMemo(() => (boot === "ready" ? getOrders() : []), [boot, dbv]);
  const wishlist = useMemo(() => (boot === "ready" ? getWishlist() : []), [boot, dbv]);
  const products = useMemo(() => (boot === "ready" ? getProducts() : []), [boot, dbv]);
  const stockMap = useMemo(
    () =>
      boot === "ready"
        ? Object.fromEntries(products.map((p) => [p.id, getStock(p.id)]))
        : {},
    [boot, dbv, products],
  );

  const count = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = cart.reduce((n, l) => n + l.price * l.qty, 0);

  /* ------------------------------ navegación ------------------------------ */
  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback(
    (cat: Category | "all") => {
      setSavedOnly(false);
      setFilter(cat);
      scrollToCatalog();
    },
    [scrollToCatalog],
  );

  const openIn3D = useCallback((p: Product) => {
    setActive(null);
    setLabPreset(p.id);
    document.getElementById("lab")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /* -------------------------------- toasts -------------------------------- */
  const pushToast = useCallback((title: string, sub: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, title, sub, kind }]);
  }, []);

  /* notas de arranque → toasts (carrito conciliado con el stock, etc.) */
  useEffect(() => {
    if (boot !== "ready") return;
    consumeBootNotes().forEach((note) => pushToast("Base de datos sincronizada", note));
  }, [boot, pushToast]);

  /* ------------------------------- carrito -------------------------------- */
  const handleAdd = useCallback(
    (p: Product, sel: Selection) => {
      const res = dbAddToCart(p, sel, sel.qty);
      if (res.ok) {
        setBumpKey((k) => k + 1);
        pushToast(`Añadido al carrito ×${sel.qty}`, res.note);
        setActive(null);
      } else {
        pushToast("No se pudo añadir", res.note, "err");
      }
    },
    [pushToast],
  );

  const quickAdd = useCallback(
    (p: Product) => {
      const stock = stockMap[p.id] ?? {};
      const variant = (p.sizes ?? p.closures ?? []).find((v) => (stock[v] ?? 0) > 0) ?? null;
      if (!variant) {
        pushToast("Agotado", `${p.name} — no queda ninguna variante.`, "err");
        return;
      }
      const sel: Selection = p.sizes
        ? { color: p.colors[0], size: variant, qty: 1 }
        : { color: p.colors[0], closure: variant, qty: 1 };
      handleAdd(p, sel);
    },
    [stockMap, handleAdd, pushToast],
  );

  const updateQty = useCallback((key: string, delta: number) => {
    const line = getCart().find((l) => l.key === key);
    if (!line) return;
    setCartQty(key, line.qty + delta);
  }, []);

  const maxQty = useCallback(
    (l: { productId: string; size?: string; closure?: string }) => {
      const variant = l.size || l.closure || "";
      return Math.max(1, stockMap[l.productId]?.[variant] ?? 1);
    },
    [stockMap],
  );

  /* -------------------------------- pedidos ------------------------------- */
  const handlePlace = useCallback(
    (customer: Order["customer"], payment: "cod" | "transfer", discountPct: number) =>
      placeOrder(
        cart.map((l) => ({
          productId: l.productId,
          name: l.name,
          image: l.image,
          price: l.price,
          color: l.color,
          size: l.size,
          closure: l.closure,
          qty: l.qty,
        })),
        customer,
        payment,
        discountPct,
      ),
    [cart],
  );

  const handleReorder = useCallback(
    (o: Order) => {
      let added = 0;
      let skipped = 0;
      for (const it of o.items) {
        const p = products.find((x) => x.id === it.productId);
        if (!p) {
          skipped++;
          continue;
        }
        const res = dbAddToCart(p, { color: it.color, size: it.size, closure: it.closure }, it.qty);
        if (res.ok) added++;
        else skipped++;
      }
      setOrdersOpen(false);
      setCartOpen(true);
      setBumpKey((k) => k + 1);
      pushToast(
        "Pedido repetido",
        skipped > 0
          ? `${added} artículo(s) añadidos — ${skipped} sin stock actualmente.`
          : `${added} artículo(s) de vuelta en tu carrito.`,
        skipped > 0 ? "err" : "ok",
      );
    },
    [products, pushToast],
  );

  const finishCheckout = useCallback(() => {
    setCheckoutOpen(false);
    pushToast("Pedido enviado", "Guardado en la tabla orders — confírmalo por WhatsApp.");
  }, [pushToast]);

  /* ------------------- overlays: escape + bloqueo de scroll --------------- */
  const anyOverlay = cartOpen || checkoutOpen || ordersOpen || consoleOpen || staffOpen || active !== null;

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
      else if (staffOpen) setStaffOpen(false);
      else if (consoleOpen) setConsoleOpen(false);
      else if (ordersOpen) setOrdersOpen(false);
      else if (cartOpen) setCartOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [checkoutOpen, active, staffOpen, consoleOpen, ordersOpen, cartOpen]);

  /* -------------------------------- render -------------------------------- */
  if (boot !== "ready") {
    return <BootScreen error={boot === "error" ? bootError : undefined} onRetry={boot === "error" ? bootDB : undefined} />;
  }

  return (
    <div className="min-h-screen bg-ink text-bone">
      <Ticker items={TICKER_ITEMS} />
      <Navbar
        cartCount={count}
        bumpKey={bumpKey}
        ordersCount={orders.length}
        products={products}
        onOpenCart={() => setCartOpen(true)}
        onOpenOrders={() => setOrdersOpen(true)}
        onOpenStaff={() => setStaffOpen(true)}
        onNav={handleNav}
        onOpenProduct={setActive}
      />

      <main>
        <Hero onShopNow={() => handleNav("all")} onCaps={() => handleNav("caps")} />
        <Ticker items={TICKER_ITEMS} reverse accent />
        <Catalog
          sectionRef={catalogRef}
          products={products}
          filter={filter}
          sort={sort}
          stock={stockMap}
          wishlist={wishlist}
          savedOnly={savedOnly}
          onFilter={(c) => {
            setSavedOnly(false);
            setFilter(c);
          }}
          onSort={setSort}
          onToggleSaved={() => setSavedOnly((v) => !v)}
          onOpen={setActive}
          onQuickAdd={quickAdd}
          onToggleWish={(p) => toggleWishlist(p.id)}
        />
        <Suspense
          fallback={
            <div className="grid h-[420px] place-items-center border-y border-seam bg-coal/60">
              <p className="flex items-center gap-3 text-[12px] font-bold uppercase tracking-[0.2em] text-ash">
                <span className="h-2 w-2 animate-blink bg-volt" /> Cargando motor 3D…
              </p>
            </div>
          }
        >
          <CapLab presetId={labPreset} onAdd={(p, sel) => handleAdd(p, { color: sel.color, closure: sel.closure, qty: sel.qty })} />
        </Suspense>
        <CapBanner onCaps={() => handleNav("caps")} />
        <LedgerStrip />
        <Newsletter />
      </main>

      <Footer onNav={handleNav} onOpenConsole={() => setConsoleOpen(true)} onOpenStaff={() => setStaffOpen(true)} />

      {/* ------------------------------ overlays ---------------------------- */}
      <CartDrawer
        open={cartOpen}
        lines={cart}
        subtotal={subtotal}
        maxQty={maxQty}
        onClose={() => setCartOpen(false)}
        onQty={updateQty}
        onRemove={removeCartLine}
        onCheckout={() => {
          if (cart.length === 0) return;
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        onBrowse={() => {
          setCartOpen(false);
          setTimeout(scrollToCatalog, 150);
        }}
      />

      <OrdersDrawer
        open={ordersOpen}
        orders={orders}
        onClose={() => setOrdersOpen(false)}
        onAdvance={advanceOrder}
        onReorder={handleReorder}
        onBrowse={() => {
          setOrdersOpen(false);
          setTimeout(scrollToCatalog, 150);
        }}
      />

      <DBConsole open={consoleOpen} onClose={() => setConsoleOpen(false)} />
      <StaffPanel open={staffOpen} onClose={() => setStaffOpen(false)} />

      {active && (
        <ProductModal
          product={active}
          stock={stockMap[active.id] ?? {}}
          onClose={() => setActive(null)}
          onAdd={handleAdd}
          onOpen3D={openIn3D}
        />
      )}

      {checkoutOpen && cart.length > 0 && (
        <CheckoutModal
          lines={cart}
          subtotal={subtotal}
          onClose={() => setCheckoutOpen(false)}
          onPlace={handlePlace}
          onShowOrders={() => {
            setCheckoutOpen(false);
            setOrdersOpen(true);
          }}
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

      {/* barra rápida de carrito en móvil */}
      {count > 0 && !anyOverlay && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-volt/40 bg-ink/95 p-3 backdrop-blur-md md:hidden">
          <button
            onClick={() => setCartOpen(true)}
            className="flex w-full items-center justify-between bg-volt px-5 py-3.5 text-ink transition-transform active:scale-[0.98]"
          >
            <span className="flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-[0.16em]">
              <IconBag className="h-4 w-4" />
              Ver carrito · {count} {count === 1 ? "artículo" : "artículos"}
            </span>
            <span className="font-display text-xl">{fmt(subtotal)}</span>
          </button>
        </div>
      )}

      {/* grano de película sobre todo */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[90] opacity-[0.05]" />
    </div>
  );
}

/* -------------------------------- toast card ------------------------------ */
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
      className={`pointer-events-auto flex w-full animate-toast-in items-center gap-3 border border-seam border-l-4 bg-coal px-4 py-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.6)] transition-colors hover:border-volt/60 ${
        toast.kind === "ok" ? "border-l-volt" : "border-l-ember"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center ${
          toast.kind === "ok" ? "bg-volt/15 text-volt" : "bg-ember/15 text-ember"
        }`}
      >
        <IconBolt className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-bold uppercase tracking-wide">{toast.title}</span>
        <span className="block truncate text-[12px] text-ash">{toast.sub}</span>
      </span>
    </button>
  );
}
