import { useEffect, useState } from "react";
import { fmt, type ColorOpt, type Product } from "../data/products";
import { IconBolt, IconCheck, IconClose, IconMinus, IconPlus } from "./icons";

export type Selection = { color: ColorOpt; size?: string; closure?: string; qty: number };

/* Product detail overlay — stock-aware selectors: colors, sizes, closures */
export default function ProductModal({
  product,
  stock,
  onClose,
  onAdd,
}: {
  product: Product;
  stock: Record<string, number>; // variant -> units left
  onClose: () => void;
  onAdd: (p: Product, sel: Selection) => void;
}) {
  const [color, setColor] = useState<ColorOpt>(product.colors[0]);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [closure, setClosure] = useState<string | undefined>(product.closures?.[0]);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  /* reset selectors when switching product */
  useEffect(() => {
    setColor(product.colors[0]);
    setSize(undefined);
    setClosure(product.closures?.[0]);
    setQty(1);
    setSizeError(false);
  }, [product]);

  /* current variant + remaining units for it */
  const variant = product.sizes ? size : closure;
  const remaining = variant ? stock[variant] ?? 0 : Math.max(0, ...Object.values(stock), 0);
  const leftHint = variant && remaining > 0 && remaining <= 3 ? `Only ${remaining} left in ${variant}` : null;

  /* keep qty within real stock whenever the variant changes */
  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, Math.max(1, remaining))));
  }, [remaining]);

  const submit = () => {
    if (product.sizes && !size) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1400);
      return;
    }
    onAdd(product, { color, size, closure, qty });
  };

  const sale = product.compareAt && product.compareAt > product.price;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      <div className="animate-rise relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-seam bg-coal sm:max-h-[88dvh]">
        <button
          onClick={onClose}
          aria-label="Close product details"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-seam bg-ink/80 text-bone transition-colors hover:border-volt hover:text-volt"
        >
          <IconClose className="w-4 h-4" />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* image side */}
          <div className="relative border-b border-seam bg-panel sm:border-b-0 sm:border-r">
            {product.tag && (
              <span
                className={`absolute left-4 top-4 z-10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  product.tag === "NEW" ? "bg-volt text-ink" : product.tag === "HOT" ? "bg-grape text-ink" : "bg-ember text-ink"
                }`}
              >
                {product.tag}
              </span>
            )}
            <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
            <div className="absolute bottom-4 left-4 border border-seam bg-ink/85 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ash">SKU</p>
              <p className="text-sm font-bold tracking-wide">{product.sku}</p>
            </div>
          </div>

          {/* detail side */}
          <div className="flex flex-col p-5 sm:p-7">
            <p className="text-[11px] uppercase tracking-[0.24em] text-volt">
              {product.category === "caps" ? "Headwear" : product.category === "tees" ? "Tops / Tees" : "Tops / Hoodies"}
            </p>
            <h3 className="mt-2 font-display text-3xl leading-[0.95] sm:text-4xl">{product.name.toUpperCase()}</h3>

            <p className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-3xl text-volt">{fmt(product.price)}</span>
              {sale && <span className="text-sm text-ash line-through">{fmt(product.compareAt as number)}</span>}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-ash">{product.description}</p>

            <ul className="mt-4 grid grid-cols-1 gap-1.5">
              {product.details.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-[13px] text-bone/85">
                  <IconBolt className="w-3 h-3 text-volt" /> {d}
                </li>
              ))}
            </ul>

            {/* ---- COLOR ---- */}
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                Color — <span className="text-bone">{color.name}</span>
              </p>
              <div className="mt-2.5 flex gap-2.5">
                {product.colors.map((c) => {
                  const active = c.name === color.name;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c.name}`}
                      title={c.name}
                      className={`grid h-11 w-11 place-items-center border-2 transition-all duration-200 ${
                        active ? "border-volt scale-105" : "border-seam hover:border-ash"
                      }`}
                      style={{ backgroundColor: `${c.hex}22` }}
                    >
                      <span className="h-6 w-6 rounded-full border border-bone/20" style={{ backgroundColor: c.hex }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---- SIZE (clothing) — sold-out sizes disabled by live stock ---- */}
            {product.sizes && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                  Size {size ? <span className="text-bone">— {size}</span> : <span className="text-ember">* required</span>}
                </p>
                <div className={`mt-2.5 flex gap-2 ${sizeError ? "animate-pop" : ""}`}>
                  {product.sizes.map((s) => {
                    const units = stock[s] ?? 0;
                    const out = units === 0;
                    const active = size === s;
                    return (
                      <button
                        key={s}
                        onClick={() => !out && setSize(s)}
                        disabled={out}
                        title={out ? "Sold out" : `${units} in stock`}
                        className={`h-11 min-w-12 border px-3 text-sm font-bold transition-all duration-200 ${
                          out
                            ? "cursor-not-allowed border-seam/50 text-ash/40 line-through"
                            : active
                              ? "border-volt bg-volt text-ink"
                              : sizeError
                                ? "border-ember text-bone hover:border-volt"
                                : "border-seam text-bone hover:border-volt hover:text-volt"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {sizeError ? (
                  <p className="mt-2 text-[12px] font-semibold text-ember">Pick a size first — S to XL.</p>
                ) : (
                  leftHint && <p className="mt-2 text-[12px] font-semibold text-volt">{leftHint} — moving fast.</p>
                )}
              </div>
            )}

            {/* ---- CLOSURE (caps) — live units per closure ---- */}
            {product.closures && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                  Closure — <span className="text-bone">{closure}</span>
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {product.closures.map((c) => {
                    const units = stock[c] ?? 0;
                    const out = units === 0;
                    const active = closure === c;
                    return (
                      <button
                        key={c}
                        onClick={() => !out && setClosure(c)}
                        disabled={out}
                        className={`border px-3 py-2.5 text-left transition-all duration-200 ${
                          out
                            ? "cursor-not-allowed border-seam/50 opacity-50"
                            : active
                              ? "border-volt bg-volt/10"
                              : "border-seam hover:border-ash"
                        }`}
                      >
                        <span className={`flex items-center gap-1.5 text-sm font-bold ${out ? "text-ash line-through" : active ? "text-volt" : "text-bone"}`}>
                          {active && !out && <IconCheck className="w-3.5 h-3.5" />}
                          {c}
                        </span>
                        <span className={`mt-0.5 block text-[11px] ${out ? "text-ember" : "text-ash"}`}>
                          {out ? "Sold out" : `${units} in stock`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {leftHint && <p className="mt-2 text-[12px] font-semibold text-volt">{leftHint} — moving fast.</p>}
              </div>
            )}

            {/* ---- QTY + ADD (clamped to real stock) ---- */}
            <div className="mt-6 flex gap-2.5">
              <div className="flex items-center border border-seam">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="grid h-12 w-11 place-items-center text-ash transition-colors hover:bg-panel hover:text-bone"
                >
                  <IconMinus />
                </button>
                <span className="w-9 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(Math.max(1, remaining), q + 1))}
                  aria-label="Increase quantity"
                  disabled={qty >= remaining}
                  className="grid h-12 w-11 place-items-center text-ash transition-colors enabled:hover:bg-panel enabled:hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconPlus />
                </button>
              </div>
              <button
                onClick={submit}
                disabled={remaining === 0}
                className="group flex h-12 flex-1 items-center justify-center gap-2.5 bg-volt text-[13px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-seam disabled:text-ash"
              >
                {remaining === 0 ? "Sold out" : `Add to cart — ${fmt(product.price * qty)}`}
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-ash">
              {remaining > 0
                ? `${remaining} units available for this variant`
                : "This variant is gone — check another"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
