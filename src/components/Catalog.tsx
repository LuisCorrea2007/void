import { useMemo, type RefObject } from "react";
import { CATEGORIES, type Category, type Product } from "../data/products";
import { totalStock } from "../lib/db";
import ProductCard from "./ProductCard";
import Reveal from "./Reveal";
import { IconHeart } from "./icons";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name";

/* Catálogo — filtros por categoría, guardados, orden y grilla con stock en vivo */
export default function Catalog({
  sectionRef,
  products,
  filter,
  sort,
  stock,
  wishlist,
  savedOnly,
  onFilter,
  onSort,
  onToggleSaved,
  onOpen,
  onQuickAdd,
  onToggleWish,
}: {
  sectionRef: RefObject<HTMLElement>;
  products: Product[];
  filter: Category | "all";
  sort: SortKey;
  stock: Record<string, Record<string, number>>;
  wishlist: string[];
  savedOnly: boolean;
  onFilter: (c: Category | "all") => void;
  onSort: (s: SortKey) => void;
  onToggleSaved: () => void;
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onToggleWish: (p: Product) => void;
}) {
  const items = useMemo(() => {
    let list = products.filter((p) => filter === "all" || p.category === filter);
    if (savedOnly) list = list.filter((p) => wishlist.includes(p.id));
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        /* destacados: lo agotado se hunde al final */
        return [...list].sort(
          (a, b) => Number(totalStock(stock, a.id) === 0) - Number(totalStock(stock, b.id) === 0),
        );
    }
  }, [products, filter, sort, savedOnly, wishlist, stock]);

  const countFor = (id: Category | "all") =>
    id === "all" ? products.length : products.filter((p) => p.category === id).length;

  return (
    <section ref={sectionRef} id="catalog" className="relative scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* cabecera */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
                <span className="h-px w-10 bg-volt" /> 01 — La alineación
              </p>
              <h2 className="mt-3 font-display text-5xl leading-[0.9] sm:text-6xl lg:text-7xl">
                EL <span className="text-outline">CATÁLOGO</span>
                <sup className="ml-2 align-super font-body text-sm font-semibold tracking-[0.2em] text-ash">
                  ({items.length})
                </sup>
              </h2>
            </div>

            {/* orden */}
            <label className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ash">
              Ordenar
              <span className="relative">
                <select
                  value={sort}
                  onChange={(e) => onSort(e.target.value as SortKey)}
                  className="cursor-pointer appearance-none border border-seam bg-panel py-2.5 pl-4 pr-9 text-[12px] font-semibold uppercase tracking-[0.14em] text-bone outline-none transition-colors hover:border-ash focus:border-volt"
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Precio ↑</option>
                  <option value="price-desc">Precio ↓</option>
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

        {/* chips de filtro + guardados */}
        <Reveal delay={80}>
          <div className="no-scrollbar mt-8 flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => {
              const active = filter === c.id && !savedOnly;
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
                  <span className={`text-[10px] font-bold tabular-nums ${active ? "text-ink/60" : "text-ash/60"}`}>
                    {countFor(c.id)}
                  </span>
                </button>
              );
            })}

            <span className="mx-2 h-6 w-px shrink-0 bg-seam" />

            <button
              onClick={onToggleSaved}
              className={`flex shrink-0 items-center gap-2 border px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                savedOnly
                  ? "border-grape bg-grape text-bone"
                  : "border-seam bg-coal text-ash hover:border-grape hover:text-volt"
              }`}
            >
              <IconHeart className="h-3.5 w-3.5" filled={savedOnly} />
              Guardados
              <span className={`text-[10px] font-bold tabular-nums ${savedOnly ? "text-bone/60" : "text-ash/60"}`}>
                {wishlist.length}
              </span>
            </button>
          </div>
        </Reveal>

        {/* grilla / estados vacíos */}
        {items.length === 0 ? (
          <div className="mt-8 border border-dashed border-seam px-6 py-20 text-center">
            <p className="text-outline font-display text-4xl sm:text-5xl">
              {savedOnly ? "NADA GUARDADO." : "TODO VENDIDO."}
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-ash">
              {savedOnly
                ? "Toca el corazón en cualquier producto para guardarlo aquí — tus guardados viven en la base de datos."
                : "Este filtro no tiene stock vivo por ahora. Prueba con otra categoría."}
            </p>
            {savedOnly && (
              <button
                onClick={onToggleSaved}
                className="mt-6 bg-volt px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
              >
                Ver todo
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 70}>
                <ProductCard
                  product={p}
                  total={totalStock(stock, p.id)}
                  saved={wishlist.includes(p.id)}
                  onOpen={onOpen}
                  onQuickAdd={onQuickAdd}
                  onToggleWish={onToggleWish}
                />
              </Reveal>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.2em] text-ash">
          Mostrando {items.length} de {products.length} piezas — stock en vivo, tiradas limitadas
        </p>
      </div>
    </section>
  );
}
