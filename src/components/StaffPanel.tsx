import { useMemo, useState } from "react";
import { fmt, type Category, type ColorOpt, type Product } from "../data/products";
import {
  deleteProduct,
  exportStoreDB,
  getOrders,
  getProducts,
  getRating,
  getReviews,
  getStock,
  ORDER_FLOW,
  resetDB,
  setOrderStatus,
  setProductActive,
  setVariantStock,
  upsertProduct,
  useDB,
  type OrderStatus,
} from "../lib/db";
import { IconBolt, IconClose, IconDatabase, IconPlus, IconTrash } from "./icons";

const ACCESS_CODE = "GENGAR2026";
const SESSION_KEY = "vlt_staff_ok";
const STATUS_ES: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
};

type Tab = "productos" | "pedidos" | "datos";

/* ------------------------------ form state ------------------------------- */
type FormState = {
  id: string | null;
  sku: string;
  name: string;
  category: Category;
  price: string;
  compareAt: string;
  tag: "" | "NEW" | "HOT" | "LAST CALL";
  image: string;
  description: string;
  details: string;
  colors: { name: string; hex: string }[];
  variants: string[];
  stock: Record<string, string>;
};

function blankForm(category: Category): FormState {
  return {
    id: null,
    sku: "",
    name: "",
    category,
    price: "",
    compareAt: "",
    tag: "",
    image: "",
    description: "",
    details: "",
    colors: [{ name: "Negro Jet", hex: "#1a1a1a" }],
    variants: category === "caps" ? ["Snapback", "Strapback"] : ["S", "M", "L", "XL"],
    stock: {},
  };
}

function productToForm(p: Product): FormState {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: String(p.price),
    compareAt: p.compareAt ? String(p.compareAt) : "",
    tag: p.tag ?? "",
    image: p.image,
    description: p.description,
    details: p.details.join("\n"),
    colors: p.colors.map((c) => ({ ...c })),
    variants: p.sizes ?? p.closures ?? [],
    stock: Object.fromEntries(Object.entries(getStock(p.id)).map(([k, v]) => [k, String(v)])),
  };
}

/* ========================================================================= */
export default function StaffPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  useDB();
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const [tab, setTab] = useState<Tab>("productos");
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const products = useMemo(() => (open ? getProducts(true) : []), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const orders = useMemo(() => (open ? getOrders() : []), [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  /* ------------------------------- login -------------------------------- */
  if (!authed) {
    return (
      <Shell title="ACCESO STAFF" onClose={onClose}>
        <div className="mx-auto max-w-sm px-6 py-14 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center border border-grape bg-grape/15 text-volt">
            <IconBolt className="w-6 h-6" />
          </span>
          <p className="mt-5 text-sm text-ash">
            Zona exclusiva para el equipo. Ingresa el código de acceso para gestionar el catálogo,
            pedidos y datos de la tienda.
          </p>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setCodeError(false); }}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (code.trim().toUpperCase() === ACCESS_CODE) {
                sessionStorage.setItem(SESSION_KEY, "1");
                setAuthed(true);
              } else setCodeError(true);
            }}
            placeholder="Código de acceso"
            type="password"
            autoFocus
            className={`mt-6 w-full border bg-panel px-4 py-3 text-center text-sm tracking-[0.3em] text-bone placeholder:tracking-normal placeholder:text-ash/60 outline-none ${
              codeError ? "animate-pop border-ember" : "border-seam focus:border-volt"
            }`}
          />
          {codeError && <p className="mt-2 text-xs font-semibold text-ember">Código incorrecto. Intenta de nuevo.</p>}
          <button
            onClick={() => {
              if (code.trim().toUpperCase() === ACCESS_CODE) {
                sessionStorage.setItem(SESSION_KEY, "1");
                setAuthed(true);
              } else setCodeError(true);
            }}
            className="mt-4 w-full bg-volt py-3.5 text-[12px] font-bold uppercase tracking-[0.18em] text-ink transition-all hover:brightness-110"
          >
            Entrar al panel
          </button>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); setCode(""); }}
            className="mt-6 text-[10px] uppercase tracking-[0.16em] text-ash underline-offset-4 hover:text-bone hover:underline"
          >
            ¿Olvidaste la sesión? Reiníciala
          </button>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ toolbar -------------------------------- */
  return (
    <Shell title="PANEL DE STAFF" onClose={onClose} wide>
      {/* tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-seam px-4 py-3">
        {(
          [
            ["productos", `Productos (${products.length})`],
            ["pedidos", `Pedidos (${orders.length})`],
            ["datos", "Datos"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              tab === id ? "border-volt bg-volt text-ink" : "border-seam text-ash hover:border-ash hover:text-bone"
            }`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
          className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-ash hover:text-ember"
        >
          Cerrar sesión
        </button>
      </div>

      {/* ------------------------------ PRODUCTOS --------------------------- */}
      {tab === "productos" && (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-ash">
              Los cambios se guardan en la tabla <span className="text-volt">products</span> al instante.
            </p>
            <button
              onClick={() => { setForm(blankForm("caps")); setFormError(""); }}
              className="flex shrink-0 items-center gap-2 bg-volt px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink hover:brightness-110"
            >
              <IconPlus className="w-3.5 h-3.5" /> Nuevo producto
            </button>
          </div>

          {/* list */}
          {!form && (
            <ul className="space-y-2">
              {products.map((p) => {
                const stock = getStock(p.id);
                const total = Object.values(stock).reduce((a, b) => a + b, 0);
                const rating = getRating(p.id);
                return (
                  <li key={p.id} className={`border border-seam bg-panel/40 p-3 ${p.active ? "" : "opacity-55"}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <img src={p.image} alt="" className="h-14 w-14 border border-seam object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-wide">
                          {p.name}
                          {p.tag && <span className="bg-plum px-1.5 py-0.5 text-[9px] font-bold tracking-[0.12em] text-bone">{p.tag}</span>}
                        </p>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-ash">
                          {p.sku} · {fmt(p.price)} · stock {total}
                          {rating.count > 0 && <span className="text-volt"> · ★ {rating.avg.toFixed(1)} ({rating.count})</span>}
                        </p>
                        {/* inline stock editor */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {Object.entries(stock).map(([variant, units]) => (
                            <label key={variant} className="flex items-center gap-1 border border-seam bg-ink px-2 py-1 text-[11px]">
                              <span className="uppercase tracking-wide text-ash">{variant}</span>
                              <input
                                type="number"
                                min={0}
                                value={units}
                                onChange={(e) => setVariantStock(p.id, variant, Number(e.target.value))}
                                className="w-10 bg-transparent text-right font-bold text-bone outline-none"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setProductActive(p.id, p.active === 0)}
                          className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
                            p.active ? "border-seam text-ash hover:border-ember hover:text-ember" : "border-volt text-volt hover:bg-volt hover:text-ink"
                          }`}
                        >
                          {p.active ? "Ocultar" : "Mostrar"}
                        </button>
                        <button
                          onClick={() => { setForm(productToForm(p)); setFormError(""); }}
                          className="border border-seam px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-bone hover:border-volt hover:text-volt"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDelete === p.id) { deleteProduct(p.id); setConfirmDelete(null); }
                            else { setConfirmDelete(p.id); setTimeout(() => setConfirmDelete(null), 2600); }
                          }}
                          className={`grid h-8 w-8 place-items-center border transition-colors ${
                            confirmDelete === p.id ? "border-ember bg-ember text-ink" : "border-seam text-ash hover:border-ember hover:text-ember"
                          }`}
                          aria-label={`Eliminar ${p.name}`}
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {confirmDelete === p.id && (
                      <p className="mt-2 text-[11px] font-semibold text-ember">Toca de nuevo para eliminar definitivamente.</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* form */}
          {form && (
            <div className="animate-rise border border-seam bg-panel/50 p-4 sm:p-5">
              <p className="font-display text-2xl">{form.id ? "EDITAR PRODUCTO" : "NUEVO PRODUCTO"}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Nombre">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} placeholder="Gorra Fantasma Púrpura" />
                </Field>
                <Field label="SKU (vacío = automático)">
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inp} placeholder={`FAN-${Math.floor(Math.random() * 900 + 100)}`} />
                </Field>
                <Field label="Categoría">
                  <select
                    value={form.category}
                    onChange={(e) => {
                      const category = e.target.value as Category;
                      setForm({
                        ...form,
                        category,
                        variants: category === "caps" ? ["Snapback", "Strapback"] : ["S", "M", "L", "XL"],
                      });
                    }}
                    className={inp}
                  >
                    <option value="caps">Gorras</option>
                    <option value="tees">Camisetas</option>
                    <option value="hoodies">Hoodies</option>
                  </select>
                </Field>
                <Field label="Etiqueta">
                  <select value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value as FormState["tag"] })} className={inp}>
                    <option value="">Sin etiqueta</option>
                    <option value="NEW">Nuevo</option>
                    <option value="HOT">Hot</option>
                    <option value="LAST CALL">Última llamada</option>
                  </select>
                </Field>
                <Field label="Precio ($)">
                  <input type="number" min={0} step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inp} placeholder="45" />
                </Field>
                <Field label="Precio anterior (opcional, para ofertas)">
                  <input type="number" min={0} step="0.5" value={form.compareAt} onChange={(e) => setForm({ ...form, compareAt: e.target.value })} className={inp} placeholder="60" />
                </Field>
              </div>

              <Field label="URL de la imagen" className="mt-3">
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className={inp} placeholder="https://…" />
              </Field>
              {form.image && (
                <img src={form.image} alt="Vista previa" className="mt-2 h-24 w-24 border border-seam object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.2")} />
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Descripción">
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inp} resize-none`} placeholder="Cuenta la historia de la pieza…" />
                </Field>
                <Field label="Detalles (uno por línea)">
                  <textarea rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} className={`${inp} resize-none`} placeholder={"Algodón 240gsm\nCorte boxy"} />
                </Field>
              </div>

              {/* colors */}
              <Field label="Colores" className="mt-3">
                <div className="space-y-2">
                  {form.colors.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={c.hex}
                        onChange={(e) => setForm({ ...form, colors: form.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                        className="h-9 w-12 cursor-pointer border border-seam bg-ink"
                      />
                      <input
                        value={c.name}
                        onChange={(e) => setForm({ ...form, colors: form.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                        className={inp}
                        placeholder="Nombre del color"
                      />
                      <button
                        onClick={() => form.colors.length > 1 && setForm({ ...form, colors: form.colors.filter((_, j) => j !== i) })}
                        className="grid h-9 w-9 shrink-0 place-items-center border border-seam text-ash hover:border-ember hover:text-ember"
                        aria-label="Quitar color"
                      >
                        <IconClose className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setForm({ ...form, colors: [...form.colors, { name: "", hex: "#733ca9" }] })}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-volt hover:brightness-125"
                  >
                    <IconPlus className="w-3 h-3" /> Añadir color
                  </button>
                </div>
              </Field>

              {/* variants + stock */}
              <Field label={form.category === "caps" ? "Cierres (stock por cierre)" : "Tallas (stock por talla)"} className="mt-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(form.category === "caps" ? ["Snapback", "Strapback"] : ["S", "M", "L", "XL"]).map((v) => {
                    const on = form.variants.includes(v);
                    return (
                      <label
                        key={v}
                        className={`flex cursor-pointer items-center justify-between border px-3 py-2.5 text-[12px] font-bold ${
                          on ? "border-volt bg-volt/10 text-volt" : "border-seam text-ash"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setForm({
                              ...form,
                              variants: on ? form.variants.filter((x) => x !== v) : [...form.variants, v],
                            })
                          }
                          className="sr-only"
                        />
                        <span>{v}</span>
                        {on && (
                          <input
                            type="number"
                            min={0}
                            value={form.stock[v] ?? "10"}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setForm({ ...form, stock: { ...form.stock, [v]: e.target.value } })}
                            className="w-12 bg-transparent text-right text-bone outline-none"
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              </Field>

              {formError && <p className="mt-3 text-xs font-semibold text-ember">{formError}</p>}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    if (form.name.trim().length < 3) return setFormError("El nombre necesita al menos 3 caracteres.");
                    const price = parseFloat(form.price);
                    if (!price || price <= 0) return setFormError("Pon un precio válido.");
                    if (!form.image.trim()) return setFormError("Falta la URL de la imagen.");
                    if (form.variants.length === 0) return setFormError("Marca al menos una variante (talla o cierre).");
                    const cleanColors: ColorOpt[] = form.colors.filter((c) => c.name.trim());
                    if (cleanColors.length === 0) return setFormError("Añade al menos un color con nombre.");
                    const compareAt = parseFloat(form.compareAt) || undefined;
                    upsertProduct(
                      {
                        id: form.id ?? `fan-${Date.now().toString(36)}`,
                        sku: form.sku.trim() || `FAN-${Math.floor(Math.random() * 9000 + 1000)}`,
                        name: form.name.trim(),
                        category: form.category,
                        price,
                        compareAt: compareAt && compareAt > price ? compareAt : undefined,
                        tag: form.tag || undefined,
                        image: form.image.trim(),
                        description: form.description.trim(),
                        details: form.details.split("\n").map((s) => s.trim()).filter(Boolean),
                        colors: cleanColors,
                        ...(form.category === "caps"
                          ? { closures: form.variants }
                          : { sizes: form.variants }),
                      },
                      Object.fromEntries(
                        form.variants.map((v) => [v, Math.max(0, parseInt(form.stock[v] ?? "10", 10) || 0)]),
                      ),
                    );
                    setForm(null);
                  }}
                  className="flex-1 bg-volt py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-ink hover:brightness-110"
                >
                  Guardar producto
                </button>
                <button
                  onClick={() => setForm(null)}
                  className="border border-seam px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-ash hover:border-ash hover:text-bone"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------- PEDIDOS ---------------------------- */}
      {tab === "pedidos" && (
        <div className="p-4">
          {orders.length === 0 ? (
            <p className="py-16 text-center text-sm text-ash">Aún no hay pedidos en la tabla <span className="text-volt">orders</span>.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="border border-seam bg-panel/40 p-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg leading-none">{o.id}</p>
                      <p className="mt-1 text-[11px] text-ash">
                        {o.customer.name} · {o.customer.whatsapp} ·{" "}
                        {new Date(o.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-[11px] text-ash">
                        {o.items.reduce((n, i) => n + i.qty, 0)} art. · {o.payment === "cod" ? "Contra entrega" : "Transferencia"} ·{" "}
                        <span className="font-bold text-volt">{fmt(o.total)}</span>
                      </p>
                    </div>
                    <select
                      value={o.status}
                      onChange={(e) => setOrderStatus(o.id, e.target.value as OrderStatus)}
                      className={`cursor-pointer border bg-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.12em] outline-none ${
                        o.status === "DELIVERED" ? "border-volt text-volt" : o.status === "SHIPPED" ? "border-grape text-volt" : "border-seam text-bone"
                      }`}
                    >
                      {ORDER_FLOW.map((s) => (
                        <option key={s} value={s}>{STATUS_ES[s]}</option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* -------------------------------- DATOS ----------------------------- */}
      {tab === "datos" && <DataTab onReset={() => {
        if (!confirmReset) { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 2600); return; }
        resetDB();
        setConfirmReset(false);
      }} confirmReset={confirmReset} />}
    </Shell>
  );
}

/* ------------------------------ data tab --------------------------------- */
function DataTab({ onReset, confirmReset }: { onReset: () => void; confirmReset: boolean }) {
  const products = getProducts(true);
  const reviews = products.flatMap((p) => getReviews(p.id).map((r) => ({ ...r, productName: p.name })));
  const subs = useMemo(
    () =>
      (allRows("SELECT email, created_at FROM subscribers ORDER BY created_at DESC") as { email: string; created_at: number }[]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const alerts = useMemo(
    () =>
      allRows("SELECT r.email, p.name FROM restock_alerts r LEFT JOIN products p ON p.id = r.product_id") as { email: string; name: string | null }[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-3">
      <div className="border border-seam bg-panel/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-volt">Reviews ({reviews.length})</p>
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {reviews.map((r) => (
            <li key={r.id} className="border border-seam/70 px-3 py-2 text-[12px]">
              <p className="font-bold">{r.name} <span className="text-volt">{"★".repeat(r.rating)}</span></p>
              <p className="text-ash">{r.productName} — {r.text}</p>
            </li>
          ))}
          {reviews.length === 0 && <li className="text-[12px] text-ash">Sin reviews todavía.</li>}
        </ul>
      </div>
      <div className="border border-seam bg-panel/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-volt">Suscriptores ({subs.length})</p>
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {subs.map((s) => (
            <li key={s.email} className="truncate border border-seam/70 px-3 py-2 text-[12px] text-bone/85">{s.email}</li>
          ))}
          {subs.length === 0 && <li className="text-[12px] text-ash">Aún nadie se apunta al drop.</li>}
        </ul>
      </div>
      <div className="border border-seam bg-panel/40 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-volt">Alertas de restock ({alerts.length})</p>
        <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto">
          {alerts.map((a, i) => (
            <li key={i} className="truncate border border-seam/70 px-3 py-2 text-[12px] text-bone/85">
              {a.email} → <span className="text-ash">{a.name ?? "?"}</span>
            </li>
          ))}
          {alerts.length === 0 && <li className="text-[12px] text-ash">Sin alertas registradas.</li>}
        </ul>
        <div className="mt-5 space-y-2 border-t border-seam pt-4">
          <a
            href={downloadHref()}
            download="vltstrt.db"
            className="flex w-full items-center justify-center gap-2 border border-seam py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-bone hover:border-volt hover:text-volt"
          >
            <IconDatabase className="w-4 h-4" /> Exportar base (.db)
          </a>
          <button
            onClick={onReset}
            className={`w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              confirmReset ? "bg-ember text-ink" : "border border-seam text-ash hover:border-ember hover:text-ember"
            }`}
          >
            {confirmReset ? "¿Seguro? Toca otra vez" : "Resetear demo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function downloadHref(): string {
  const bytes = exportStoreDB();
  const blob = new Blob([bytes as BlobPart], { type: "application/octet-stream" });
  return URL.createObjectURL(blob);
}

/* raw helper for the data tab (only runs when DB is ready) */
import { allRows } from "../lib/db";

/* ------------------------------ primitives ------------------------------- */
const inp =
  "w-full border border-seam bg-ink px-3 py-2.5 text-sm text-bone placeholder:text-ash/50 outline-none focus:border-volt";

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-ash">{label}</span>
      {children}
    </label>
  );
}

function Shell({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[75] flex items-stretch justify-end" role="dialog" aria-modal="true">
      <button aria-label="Cerrar panel" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div className={`animate-rise relative flex h-full w-full flex-col border-l border-seam bg-coal ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between border-b border-seam px-5 py-4">
          <h2 className="flex items-center gap-3 font-display text-2xl">
            <span className="grid h-8 w-8 place-items-center bg-grape text-bone"><IconBolt className="w-4 h-4" /></span>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
