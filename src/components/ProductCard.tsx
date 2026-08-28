import { fmt, type Product } from "../data/products";
import { IconPlus } from "./icons";

const tagStyle: Record<string, string> = {
  NEW: "bg-volt text-ink",
  HOT: "bg-grape text-ink",
  "LAST CALL": "bg-ember text-ink",
};

/* Catalog card — image, tag, name, price, color dots, slide-up add button */
export default function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (p: Product) => void;
}) {
  const sale = product.compareAt && product.compareAt > product.price;

  return (
    <article
      onClick={() => onOpen(product)}
      className="group relative cursor-pointer border border-seam bg-coal transition-all duration-300 hover:-translate-y-1 hover:border-volt/70 hover:shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
    >
      {/* image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {product.tag && (
          <span
            className={`absolute left-3 top-3 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${tagStyle[product.tag]}`}
          >
            {product.tag}
          </span>
        )}
        {sale && (
          <span className="absolute right-3 top-3 bg-ink/85 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ember">
            −{Math.round((1 - product.price / (product.compareAt as number)) * 100)}%
          </span>
        )}
        {/* slide-up add bar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(product);
          }}
          className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center gap-2 bg-volt py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-ink transition-transform duration-300 ease-out group-hover:translate-y-0 focus-visible:translate-y-0"
        >
          <IconPlus className="w-3.5 h-3.5" />
          Add to cart
        </button>
      </div>

      {/* body */}
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ash">
          {product.category} · {product.sku}
        </p>
        <h3 className="mt-1.5 text-[15px] font-bold uppercase leading-snug tracking-wide text-bone transition-colors group-hover:text-volt">
          {product.name}
        </h3>
        <div className="mt-2.5 flex items-center justify-between">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-xl text-bone">{fmt(product.price)}</span>
            {sale && (
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
      <span className="pointer-events-none absolute -right-px -top-px h-5 w-5 border-r-2 border-t-2 border-volt opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </article>
  );
}
