import { fmt, type Product } from "../data/products";
import { getRating, useDB } from "../lib/db";
import { IconHeart, IconPlus } from "./icons";

/* live rating pill — reads straight from the reviews table */
function RatingPill({ productId }: { productId: string }) {
  useDB();
  const r = getRating(productId);
  if (r.count === 0) return null;
  return (
    <span className="ml-2 text-[10px] font-bold tracking-wide text-volt" title={`${r.count} review(s)`}>
      ★ {r.avg.toFixed(1)} <span className="font-normal text-ash">({r.count})</span>
    </span>
  );
}

const tagStyle: Record<string, string> = {
  NEW: "bg-volt text-ink",
  HOT: "bg-grape text-ink",
  "LAST CALL": "bg-ember text-ink",
};

/* Catalog card — stock-aware, wishlist heart, sold-out state, quick add */
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
      onClick={() => !soldOut && onOpen(product)}
      className={`group relative border border-seam bg-coal transition-all duration-300 ${
        soldOut
          ? "opacity-80"
          : "cursor-pointer hover:-translate-y-1 hover:border-volt/70 hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
      }`}
    >
      {/* image */}
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
            {product.tag}
          </span>
        )}
        {sale && !soldOut && (
          <span className="absolute right-3 top-12 bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ember">
            −{Math.round((1 - product.price / (product.compareAt as number)) * 100)}%
          </span>
        )}
        {low && (
          <span className="absolute left-3 top-3 bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-volt">
            Only {total} left
          </span>
        )}

        {/* wishlist heart */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWish(product);
          }}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center border backdrop-blur-sm transition-all duration-200 active:scale-90 ${
            saved
              ? "border-grape bg-grape/20 text-grape"
              : "border-seam bg-ink/70 text-bone hover:border-grape hover:text-grape"
          }`}
        >
          <span className={saved ? "animate-pop" : ""}>
            <IconHeart className="w-4 h-4" filled={saved} />
          </span>
        </button>

        {/* sold-out stamp */}
        {soldOut ? (
          <div className="absolute inset-0 grid place-items-center">
            <span className="-rotate-12 border-2 border-bone/70 px-4 py-2 font-display text-2xl tracking-[0.2em] text-bone/80">
              SOLD OUT
            </span>
          </div>
        ) : (
          /* slide-up add bar */
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-volt py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-ink transition-transform duration-300 ease-out group-hover:translate-y-0 focus-visible:translate-y-0"
          >
            <IconPlus className="w-3.5 h-3.5" />
            Quick add
          </button>
        )}
      </div>

      {/* body */}
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

      {/* corner accent on hover */}
      {!soldOut && (
        <span className="pointer-events-none absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-volt opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
    </article>
  );
}
