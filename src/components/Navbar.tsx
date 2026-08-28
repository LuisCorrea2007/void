import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, PRODUCTS, fmt, type Category, type Product } from "../data/products";
import { IconBag, IconBolt, IconClose, IconReceipt, IconSearch } from "./icons";

/* Sticky nav: wordmark, category links, live product search, cart trigger */
export default function Navbar({
  cartCount,
  bumpKey,
  ordersCount,
  onOpenCart,
  onOpenOrders,
  onNav,
  onOpenProduct,
}: {
  cartCount: number;
  bumpKey: number;
  ordersCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onNav: (cat: Category | "all") => void;
  onOpenProduct: (p: Product) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* live search — matches name, category and sku */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.includes(q) ||
        p.sku.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query]);

  const pick = (p: Product) => {
    onOpenProduct(p);
    setQuery("");
    setFocused(false);
    setMobileSearch(false);
  };

  const searchBox = (id: string) => (
    <div className="relative w-full">
      <IconSearch className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-ash" />
      <input
        id={id}
        ref={id === "search-desktop" ? inputRef : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) pick(results[0]);
          if (e.key === "Escape") setQuery("");
        }}
        placeholder="Search caps, tees, hoodies…"
        className="w-full border border-seam bg-panel py-2 pl-9 pr-8 text-sm text-bone placeholder:text-ash/70 outline-none transition-colors focus:border-volt"
      />
      {query && (
        <button
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ash hover:text-bone"
        >
          <IconClose className="w-3.5 h-3.5" />
        </button>
      )}

      {/* live results dropdown */}
      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 border border-seam bg-coal shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-ash">
              No matches for “{query}” — try “snapback” or “hoodie”.
            </p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
                className="group flex w-full items-center gap-3 border-b border-seam/60 px-3 py-2.5 text-left last:border-0 hover:bg-panel"
              >
                <img src={p.image} alt="" className="h-10 w-10 border border-seam object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-bone group-hover:text-volt">
                    {p.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-ash">
                    {p.category} · {p.sku}
                  </span>
                </span>
                <span className="text-sm font-bold text-volt">{fmt(p.price)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled ? "border-seam bg-ink/90 backdrop-blur-md" : "border-transparent bg-ink"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* wordmark */}
        <a
          href="#top"
          className="flex items-center gap-2.5"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span className="grid h-9 w-9 place-items-center bg-volt text-ink">
            <IconBolt className="w-5 h-5" />
          </span>
          <span className="font-display text-xl leading-none tracking-wide">
            VLT<span className="text-volt">/</span>STRT
          </span>
        </a>

        {/* category links */}
        <div className="ml-6 hidden items-center gap-5 lg:flex">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => onNav(c.id)}
              className="group relative text-[12px] font-semibold uppercase tracking-[0.18em] text-ash transition-colors hover:text-bone"
            >
              {c.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-volt transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
          <a
            href="#lab"
            className="group relative flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-grape transition-colors hover:text-bone"
          >
            <span className="h-1.5 w-1.5 animate-blink rounded-full bg-grape" />
            3D Lab
            <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-grape transition-all duration-300 group-hover:w-full" />
          </a>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* desktop search */}
          <div className="hidden w-52 md:block lg:w-64">{searchBox("search-desktop")}</div>

          {/* mobile search toggle */}
          <button
            onClick={() => {
              setMobileSearch((v) => !v);
              if (!mobileSearch) setTimeout(() => inputRef.current?.focus(), 50);
            }}
            aria-label="Toggle search"
            className={`grid h-10 w-10 place-items-center border transition-colors md:hidden ${
              mobileSearch ? "border-volt bg-volt text-ink" : "border-seam text-bone hover:border-ash"
            }`}
          >
            {mobileSearch ? <IconClose className="w-4 h-4" /> : <IconSearch className="w-4 h-4" />}
          </button>

          {/* orders history trigger */}
          <button
            onClick={onOpenOrders}
            aria-label={`Order history, ${ordersCount} orders`}
            className="relative grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-grape hover:text-grape"
          >
            <IconReceipt className="w-5 h-5" />
            {ordersCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center bg-grape px-1 text-[10px] font-bold text-ink">
                {ordersCount}
              </span>
            )}
          </button>

          {/* cart trigger */}
          <button
            onClick={onOpenCart}
            aria-label={`Open cart, ${cartCount} items`}
            className="relative flex h-10 items-center gap-2 border border-seam px-3 text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconBag className="w-5 h-5" />
            <span className="hidden text-[12px] font-bold uppercase tracking-[0.14em] sm:block">
              Cart
            </span>
            <span
              key={bumpKey}
              className={`absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center px-1 text-[10px] font-bold ${
                cartCount > 0 ? "animate-pop bg-volt text-ink" : "bg-seam text-ash"
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </nav>

      {/* mobile search row */}
      {mobileSearch && (
        <div className="border-t border-seam px-4 py-3 md:hidden animate-rise">{searchBox("search-mobile")}</div>
      )}
    </header>
  );
}
