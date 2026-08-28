import { fmt, type Product } from "../data/products";
import { getRating } from "../lib/db";
import { IconHeart, IconPlus } from "./icons";

const tagLabel: Record<string, string> = {
  NEW: "NUEVO",
  HOT: "HOT",
  "LAST CALL": "ÚLTIMA LLAMADA",
};
const tagStyle: Record<string, string> = {
  NEW: "bg-volt text-ink",
  HOT: "bg-grape text-bone",
  "LAST CALL": "bg-ember text-ink",
};

/* Pastilla de rating en vivo desde la tabla reviews */
function RatingPill({ productId }: { productId: string }) {
  const r = getRating(productId);
  if (r.count === 0) return null;
  return (
    <span className="ml-2 inline-flex items-center gap-1 text-volt">
      ★ {r.avg.toFixed(1)} <span className="text-ash">({r.count})</span>
    </span>
  );
}

/* Tarjeta de catálogo — stock en vivo, corazón de guardados, añadir rápido */
export default function ProductCard({
  product,
  total,
  saved,
  onOpen,
  onQuickAdd,
  onToggleWish,
}: {
  product: Product;
  total: number;
  saved: boolean;
  onOpen: (p: Product) => void;
  onQuickAdd: (p: Product) => void;
  onToggleWish: (p: Product) => void;
}) {
  const sale = product.compareAt && product.compareAt > product.price;
  const soldOut = total === 0;
  const low = !soldOut && total <= 8;

  return (
    <article
      onClick={() => onOpen(product)}
      className={`group relative border border-seam bg-coal transition-all duration-300 ${
        soldOut
          ? "cursor-pointer opacity-80"
          : "cursor-pointer hover:-translate-y-1 hover:border-volt/70 hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      }`}
    >
      {/* imagen */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-all duration-700 ease-out ${
            soldOut ? "opacity-40 saturate-0" : "group-hover:scale-110"
          }`}
        />
        {product.tag && !soldOut && (
          <span
            className={`absolute left-3 top-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tagStyle[product.tag]}`}
          >
            {tagLabel[product.tag] ?? product.tag}
          </span>
        )}
        {sale && !soldOut && (
          <span className="absolute right-3 top-12 bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ember">
            −{Math.round((1 - product.price / (product.compareAt as number)) * 100)}%
          </span>
        )}
        {low && (
          <span className="absolute left-3 top-12 bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-volt">
            Solo quedan {total}
          </span>
        )}

        {/* corazón de guardados */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWish(product);
          }}
          aria-label={saved ? `Quitar ${product.name} de guardados` : `Guardar ${product.name}`}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center border backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            saved
              ? "border-grape bg-grape/30 text-volt"
              : "border-seam bg-ink/70 text-bone hover:border-grape hover:text-volt"
          }`}
        >
          <span className={saved ? "animate-pop" : ""}>
            <IconHeart className="h-4 w-4" filled={saved} />
          </span>
        </button>

        {/* sello de agotado */}
        {soldOut ? (
          <div className="absolute inset-0 grid place-items-center">
            <span className="-rotate-12 border-2 border-bone/70 px-4 py-2 font-display text-2xl tracking-[0.2em] text-bone/80">
              AGOTADO
            </span>
          </div>
        ) : (
          /* barra de añadir al pasar el cursor */
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-volt py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-ink transition-transform duration-300 ease-out group-hover:translate-y-0 focus-visible:translate-y-0"
          >
            <IconPlus className="h-3.5 w-3.5" />
            Añadir rápido
          </button>
        )}
      </div>

      {/* cuerpo */}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ash">
          {product.category} · {product.sku}
          <RatingPill productId={product.id} />
        </p>
        <h3
          className={`mt-1.5 text-[15px] font-bold uppercase leading-snug tracking-wide transition-colors ${
            soldOut ? "text-ash line-through decoration-1" : "text-bone group-hover:text-volt"
          }`}
        >
          {product.name}
        </h3>
        <div className="mt-2.5 flex items-center justify-between">
          <p className="flex items-baseline gap-2">
            <span className={`font-display text-xl ${soldOut ? "text-ash" : "text-bone"}`}>
              {fmt(product.price)}
            </span>
            {sale && !soldOut && (
              <span className="text-xs text-ash line-through">{fmt(product.compareAt as number)}</span>
            )}
          </p>
          <span className="flex items-center gap-1.5">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-3 w-3 rounded-full border border-bone/25"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </span>
        </div>
      </div>

      {/* acento de esquina al hover */}
      {!soldOut && (
        <span className="pointer-events-none absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-volt opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
    </article>
  );
}
