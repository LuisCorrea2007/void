import { useMemo, type RefObject } from "react";
/* NOTE: RefObject<HTMLElement> pairs with useRef<HTMLElement>(null) in App */
import { CATEGORIES, PRODUCTS, type Category, type Product } from "../data/products";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

/* Catalog section — filter chips, sort control, responsive product grid */
export default function Catalog({
  sectionRef,
  filter,
  sort,
  onFilter,
  onSort,
  onOpen,
}: {
  sectionRef: RefObject<HTMLElement>;
  filter: Category | "all";
  sort: SortKey;
  onFilter: (c: Category | "all") => void;
  onSort: (s: SortKey) => void;
  onOpen: (p: Product) => void;
}) {
  const items = useMemo(() => {
    const list = PRODUCTS.filter((p) => filter === "all" || p.category === filter);
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [filter, sort]);

  const countFor = (id: Category | "all") =>
    id === "all" ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === id).length;

  return (
    <section ref={sectionRef} id="catalog" className="relative scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* header */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
                <span className="h-px w-10 bg-volt" /> 01 — The lineup
              </p>
              <h2 className="mt-3 font-display text-5xl leading-[0.9] sm:text-6xl lg:text-7xl">
                THE <span className="text-outline">CATALOG</span>
                <sup className="ml-2 align-super text-sm font-body font-semibold tracking-[0.2em] text-ash">
                  ({items.length})
                </sup>
              </h2>
            </div>

            {/* sort */}
            <label className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ash">
              Sort
              <span className="relative">
                <select
                  value={sort}
                  onChange={(e) => onSort(e.target.value as SortKey)}
                  className="cursor-pointer appearance-none border border-seam bg-panel py-2.5 pl-4 pr-9 text-[12px] font-semibold uppercase tracking-[0.14em] text-bone outline-none transition-colors hover:border-ash focus:border-volt"
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                  <option value="name">A – Z</option>
                </select>
                <svg
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-volt"
                >
                  <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </label>
          </div>
        </Reveal>

        {/* filter chips */}
        <Reveal delay={80}>
          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => {
              const active = filter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onFilter(c.id)}
                  className={`flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                    active
                      ? "border-volt bg-volt text-ink"
                      : "border-seam bg-coal text-ash hover:border-ash hover:text-bone"
                  }`}
                >
                  {c.label}
                  <span
                    className={`text-[10px] font-bold tabular-nums ${active ? "text-ink/60" : "text-ash/60"}`}
                  >
                    {countFor(c.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) * 70}>
              <ProductCard product={p} onOpen={onOpen} />
            </Reveal>
          ))}
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.2em] text-ash">
          Showing {items.length} of {PRODUCTS.length} pieces — every drop is a limited run
        </p>
      </div>
    </section>
  );
}
