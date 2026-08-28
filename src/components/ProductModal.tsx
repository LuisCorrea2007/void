import { useEffect, useState } from "react";
import { fmt, type ColorOpt, type Product } from "../data/products";
import { addReview, getRating, getReviews, notifyRestock, useDB } from "../lib/db";
import { IconBolt, IconCheck, IconClose, IconMinus, IconPlus, IconSpark } from "./icons";

export type Selection = { color: ColorOpt; size?: string; closure?: string; qty: number };

/* Guía de tallas (cm) */
const SIZE_GUIDE = [
  { size: "S", chest: "53", length: "68", sleeve: "21" },
  { size: "M", chest: "56", length: "70", sleeve: "22" },
  { size: "L", chest: "59", length: "72", sleeve: "23" },
  { size: "XL", chest: "62", length: "74", sleeve: "24" },
];

/* Detalle de producto — selectores con stock, reseñas, restock y 3D */
export default function ProductModal({
  product,
  stock,
  onClose,
  onAdd,
  onOpen3D,
}: {
  product: Product;
  stock: Record<string, number>;
  onClose: () => void;
  onAdd: (p: Product, sel: Selection) => void;
  onOpen3D: (p: Product) => void;
}) {
  useDB(); // reseñas y stock en vivo
  const [color, setColor] = useState<ColorOpt>(product.colors[0]);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [closure, setClosure] = useState<string | undefined>(product.closures?.[0]);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  /* formulario de reseña */
  const [revOpen, setRevOpen] = useState(false);
  const [revName, setRevName] = useState("");
  const [revStars, setRevStars] = useState(5);
  const [revText, setRevText] = useState("");
  const [revDone, setRevDone] = useState(false);
  const [revError, setRevError] = useState("");

  /* alerta de restock */
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertState, setAlertState] = useState<"idle" | "done" | "exists" | "error">("idle");

  useEffect(() => {
    setColor(product.colors[0]);
    setSize(undefined);
    setClosure(product.closures?.[0]);
    setQty(1);
    setSizeError(false);
    setGuideOpen(false);
    setRevOpen(false);
    setRevDone(false);
    setRevError("");
    setAlertOpen(false);
    setAlertEmail("");
    setAlertState("idle");
  }, [product]);

  const variant = product.sizes ? size : closure;
  /* sin variante elegida aún: usamos la mejor disponibilidad para no bloquear el CTA */
  const remaining = variant ? stock[variant] ?? 0 : Math.max(0, ...Object.values(stock));
  const soldOutVariants = Object.entries(stock).filter(([, u]) => u === 0).map(([v]) => v);
  const leftHint = variant && remaining > 0 && remaining <= 3 ? `Solo quedan ${remaining} en ${variant}` : null;

  useEffect(() => {
    setQty((q) => Math.max(1, Math.min(q, Math.max(1, remaining))));
  }, [remaining]);

  const rating = getRating(product.id);
  const reviews = getReviews(product.id);

  const submit = () => {
    if (product.sizes && !size) {
      setSizeError(true);
      setTimeout(() => setSizeError(false), 1400);
      return;
    }
    onAdd(product, { color, size, closure, qty });
  };

  const submitReview = () => {
    if (revName.trim().length < 2) return setRevError("Deja un nombre (mínimo 2 caracteres).");
    if (revText.trim().length < 5) return setRevError("Cuéntanos al menos una línea.");
    addReview(product.id, revName, revStars, revText);
    setRevDone(true);
    setRevError("");
  };

  const submitAlert = () => {
    if (!alertEmail.includes("@") || alertEmail.length < 5) return setAlertState("error");
    setAlertState(notifyRestock(product.id, alertEmail) === "added" ? "done" : "exists");
  };

  const sale = product.compareAt && product.compareAt > product.price;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={product.name}>
      <button aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      <div className="animate-rise relative max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-seam bg-coal sm:max-h-[88dvh]">
        <button
          onClick={onClose}
          aria-label="Cerrar detalle de producto"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-seam bg-ink/80 text-bone transition-colors hover:border-volt hover:text-volt"
        >
          <IconClose className="h-4 w-4" />
        </button>

        <div className="grid sm:grid-cols-2">
          {/* lado imagen */}
          <div className="relative border-b border-seam bg-panel sm:border-b-0 sm:border-r">
            {product.tag && (
              <span
                className={`absolute left-4 top-4 z-10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                  product.tag === "NEW" ? "bg-volt text-ink" : product.tag === "HOT" ? "bg-grape text-bone" : "bg-ember text-ink"
                }`}
              >
                {product.tag === "NEW" ? "NUEVO" : product.tag === "LAST CALL" ? "ÚLTIMA LLAMADA" : "HOT"}
              </span>
            )}
            <img src={product.image} alt={product.name} className="aspect-square w-full object-cover" />
            <div className="absolute bottom-4 left-4 border border-seam bg-ink/85 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ash">SKU</p>
              <p className="text-sm font-bold tracking-wide">{product.sku}</p>
            </div>
            {/* ver en 3D — solo gorras */}
            {product.category === "caps" && (
              <button
                onClick={() => onOpen3D(product)}
                className="absolute bottom-4 right-4 flex items-center gap-2 bg-volt px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink transition-transform hover:-translate-y-0.5"
              >
                <IconSpark className="h-3.5 w-3.5" /> Ver en 3D
              </button>
            )}
          </div>

          {/* lado detalle */}
          <div className="flex flex-col p-5 sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-volt">
                {product.category === "caps" ? "Gorras" : product.category === "tees" ? "Camisetas" : "Hoodies"}
              </p>
              <button
                onClick={() => setRevOpen(true)}
                className="flex shrink-0 items-center gap-1.5 border border-seam px-2.5 py-1 text-[11px] font-bold text-volt transition-colors hover:border-volt"
                title="Leer / escribir reseñas"
              >
                ★ {rating.count > 0 ? rating.avg.toFixed(1) : "—"}
                <span className="font-normal text-ash">({rating.count})</span>
              </button>
            </div>
            <h3 className="mt-2 font-display text-3xl leading-[0.95] sm:text-4xl">{product.name.toUpperCase()}</h3>

            <p className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-3xl text-volt">{fmt(product.price)}</span>
              {sale && <span className="text-sm text-ash line-through">{fmt(product.compareAt as number)}</span>}
            </p>

            <p className="mt-4 text-sm leading-relaxed text-ash">{product.description}</p>

            <ul className="mt-4 grid grid-cols-1 gap-1.5">
              {product.details.map((d) => (
                <li key={d} className="flex items-center gap-2.5 text-[13px] text-bone/85">
                  <IconBolt className="h-3 w-3 text-volt" /> {d}
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
                        active ? "scale-105 border-volt" : "border-seam hover:border-ash"
                      }`}
                      style={{ backgroundColor: `${c.hex}22` }}
                    >
                      <span className="h-6 w-6 rounded-full border border-bone/20" style={{ backgroundColor: c.hex }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ---- TALLA ---- */}
            {product.sizes && (
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                    Talla {size ? <span className="text-bone">— {size}</span> : <span className="text-ember">* obligatoria</span>}
                  </p>
                  <button
                    onClick={() => setGuideOpen(true)}
                    className="text-[11px] font-bold uppercase tracking-[0.14em] text-volt underline-offset-4 hover:underline"
                  >
                    Guía de tallas
                  </button>
                </div>
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
                        title={out ? "Agotada" : `${units} en stock`}
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
                  <p className="mt-2 text-[12px] font-semibold text-ember">Elige una talla primero — de la S a la XL.</p>
                ) : (
                  leftHint && <p className="mt-2 text-[12px] font-semibold text-volt">{leftHint} — vuela.</p>
                )}
              </div>
            )}

            {/* ---- CIERRE ---- */}
            {product.closures && (
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                  Cierre — <span className="text-bone">{closure}</span>
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
                          out ? "cursor-not-allowed border-seam/50 opacity-50" : active ? "border-volt bg-volt/10" : "border-seam hover:border-ash"
                        }`}
                      >
                        <span className={`flex items-center gap-1.5 text-sm font-bold ${out ? "text-ash line-through" : active ? "text-volt" : "text-bone"}`}>
                          {active && !out && <IconCheck className="h-3.5 w-3.5" />}
                          {c}
                        </span>
                        <span className={`mt-0.5 block text-[11px] ${out ? "text-ember" : "text-ash"}`}>
                          {out ? "Agotado" : `${units} en stock`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {leftHint && <p className="mt-2 text-[12px] font-semibold text-volt">{leftHint} — vuela.</p>}
              </div>
            )}

            {/* ---- alerta de restock ---- */}
            {soldOutVariants.length > 0 && (
              <div className="mt-5 border border-dashed border-seam px-4 py-3">
                {!alertOpen ? (
                  <button
                    onClick={() => setAlertOpen(true)}
                    className="flex w-full items-center justify-between text-[12px] font-semibold text-ash transition-colors hover:text-volt"
                  >
                    <span>
                      Agotado: <span className="text-ember">{soldOutVariants.join(", ")}</span>
                    </span>
                    <span className="font-bold uppercase tracking-[0.12em] text-volt">Avísame →</span>
                  </button>
                ) : alertState === "done" ? (
                  <p className="animate-pop flex items-center gap-2 text-[12px] font-semibold text-volt">
                    <IconCheck className="h-4 w-4" /> Guardado en restock_alerts — serás de los primeros.
                  </p>
                ) : alertState === "exists" ? (
                  <p className="text-[12px] font-semibold text-volt">Ya estás en la lista para esta pieza.</p>
                ) : (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ash">
                      Alerta de restock — {soldOutVariants.join(", ")}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={alertEmail}
                        onChange={(e) => { setAlertEmail(e.target.value); setAlertState("idle"); }}
                        onKeyDown={(e) => e.key === "Enter" && submitAlert()}
                        placeholder="tu@correo.com"
                        className={`min-w-0 flex-1 border bg-panel px-3 py-2.5 text-[13px] text-bone placeholder:text-ash/60 outline-none ${
                          alertState === "error" ? "border-ember" : "border-seam focus:border-volt"
                        }`}
                      />
                      <button
                        onClick={submitAlert}
                        className="shrink-0 bg-volt px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-ink transition-all hover:brightness-110"
                      >
                        Avisarme
                      </button>
                    </div>
                    {alertState === "error" && (
                      <p className="mt-1.5 text-[11px] font-semibold text-ember">Ese correo no parece válido.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---- CANTIDAD + AÑADIR ---- */}
            <div className="mt-6 flex gap-2.5">
              <div className="flex items-center border border-seam">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Bajar cantidad"
                  className="grid h-12 w-11 place-items-center text-ash transition-colors hover:bg-panel hover:text-bone"
                >
                  <IconMinus />
                </button>
                <span className="w-9 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(Math.max(1, remaining), q + 1))}
                  aria-label="Subir cantidad"
                  disabled={qty >= remaining}
                  className="grid h-12 w-11 place-items-center text-ash transition-colors enabled:hover:bg-panel enabled:hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconPlus />
                </button>
              </div>
              <button
                onClick={submit}
                disabled={remaining === 0}
                className="flex h-12 flex-1 items-center justify-center gap-2.5 bg-volt text-[13px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-200 enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-seam disabled:text-ash"
              >
                {remaining === 0 ? "Agotado" : `Añadir al carrito — ${fmt(product.price * qty)}`}
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.16em] text-ash">
              {remaining > 0 ? `${remaining} unidades en la tabla stock` : "Esta variante voló — prueba otra"}
            </p>

            {/* ---- reseñas ---- */}
            <div className="mt-6 border-t border-seam pt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
                  Reseñas <span className="text-volt">({rating.count})</span>
                  {rating.count > 0 && <span className="ml-2 text-volt">★ {rating.avg.toFixed(1)}</span>}
                </p>
                <button
                  onClick={() => { setRevOpen((v) => !v); setRevDone(false); }}
                  className="text-[11px] font-bold uppercase tracking-[0.14em] text-volt underline-offset-4 hover:underline"
                >
                  {revOpen ? "Cerrar" : "Escribir una"}
                </button>
              </div>

              {revOpen && (
                <div className="animate-rise mt-3 border border-seam bg-panel/50 p-4">
                  {revDone ? (
                    <p className="animate-pop flex items-center gap-2 text-[13px] font-semibold text-volt">
                      <IconCheck className="h-4 w-4" /> Reseña guardada en la base de datos. Respeto.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          value={revName}
                          onChange={(e) => setRevName(e.target.value)}
                          placeholder="Tu nombre"
                          className="min-w-0 flex-1 border border-seam bg-ink px-3 py-2.5 text-[13px] text-bone placeholder:text-ash/60 outline-none focus:border-volt"
                        />
                        <div className="flex gap-1" role="radiogroup" aria-label="Calificación">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              onClick={() => setRevStars(s)}
                              aria-label={`${s} estrella${s > 1 ? "s" : ""}`}
                              className={`text-xl leading-none transition-transform hover:scale-110 ${s <= revStars ? "text-volt" : "text-seam"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={revText}
                        onChange={(e) => setRevText(e.target.value)}
                        rows={2}
                        placeholder="¿Cómo queda? ¿Qué tal el peso?"
                        className="mt-2 w-full resize-none border border-seam bg-ink px-3 py-2.5 text-[13px] text-bone placeholder:text-ash/60 outline-none focus:border-volt"
                      />
                      {revError && <p className="mt-1.5 text-[11px] font-semibold text-ember">{revError}</p>}
                      <button
                        onClick={submitReview}
                        className="mt-2.5 w-full bg-grape py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-bone transition-all hover:brightness-125"
                      >
                        Publicar reseña
                      </button>
                    </>
                  )}
                </div>
              )}

              <ul className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
                {reviews.length === 0 && (
                  <li className="text-[12px] text-ash">Aún no hay reseñas — sé el primero del barrio.</li>
                )}
                {reviews.map((r) => (
                  <li key={r.id} className="border border-seam/70 bg-panel/40 px-3.5 py-2.5">
                    <p className="flex items-center justify-between text-[12px]">
                      <span className="font-bold">{r.name}</span>
                      <span className="text-volt">{"★".repeat(r.rating)}<span className="text-seam">{"★".repeat(5 - r.rating)}</span></span>
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-ash">{r.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ---- guía de tallas ---- */}
        {guideOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm">
            <div className="animate-rise w-full max-w-sm border border-seam bg-coal p-6">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-2xl">GUÍA DE TALLAS</h4>
                <button
                  onClick={() => setGuideOpen(false)}
                  aria-label="Cerrar guía de tallas"
                  className="grid h-9 w-9 place-items-center border border-seam text-bone hover:border-volt hover:text-volt"
                >
                  <IconClose className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ash">Prenda en plano, en cm — corte boxy</p>
              <table className="mt-4 w-full text-[13px]">
                <thead>
                  <tr className="border-b border-seam text-left text-[11px] uppercase tracking-[0.16em] text-volt">
                    <th className="py-2">Talla</th>
                    <th className="py-2">Pecho</th>
                    <th className="py-2">Largo</th>
                    <th className="py-2">Manga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-seam/60">
                  {SIZE_GUIDE.map((r) => (
                    <tr key={r.size}>
                      <td className="py-2.5 font-display text-lg">{r.size}</td>
                      <td className="py-2.5 tabular-nums text-bone/85">{r.chest}</td>
                      <td className="py-2.5 tabular-nums text-bone/85">{r.length}</td>
                      <td className="py-2.5 tabular-nums text-bone/85">{r.sleeve}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-ash">¿Entre dos tallas? Pide la menor — el corte es boxy.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
