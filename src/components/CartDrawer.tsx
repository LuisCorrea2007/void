import { STORE, fmt, type CartLine } from "../data/products";
import { IconArrow, IconClose, IconMinus, IconPlus, IconTrash, IconTruck } from "./icons";

/* Carrito lateral: cantidades, medidor de envío gratis, subtotal, checkout */
export default function CartDrawer({
  open,
  lines,
  subtotal,
  maxQty,
  onClose,
  onQty,
  onRemove,
  onCheckout,
  onBrowse,
}: {
  open: boolean;
  lines: CartLine[];
  subtotal: number;
  maxQty: (l: CartLine) => number;
  onClose: () => void;
  onQty: (key: string, delta: number) => void;
  onRemove: (key: string) => void;
  onCheckout: () => void;
  onBrowse: () => void;
}) {
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const remaining = STORE.freeShipThreshold - subtotal;
  const pct = Math.min(100, (subtotal / STORE.freeShipThreshold) * 100);

  return (
    <>
      {/* fondo */}
      <button
        aria-label="Cerrar carrito"
        onClick={onClose}
        className={`fixed inset-0 z-[64] bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[65] flex w-full max-w-md flex-col border-l border-seam bg-coal transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* cabecera */}
        <div className="flex items-center justify-between border-b border-seam px-5 py-4">
          <h2 className="flex items-baseline gap-3 font-display text-2xl">
            TU CARRITO
            <span className="bg-volt px-2 py-0.5 font-body text-xs font-bold text-ink">{count}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* medidor de envío gratis */}
        {lines.length > 0 && (
          <div className="border-b border-seam px-5 py-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <IconTruck className="h-4 w-4 text-volt" />
              {remaining > 0 ? (
                <span className="text-ash">
                  Te faltan <span className="text-volt">{fmt(remaining)}</span> para envío gratis
                </span>
              ) : (
                <span className="text-volt">Envío gratis desbloqueado</span>
              )}
            </p>
            <div className="mt-2.5 h-1.5 w-full bg-panel">
              <div
                className={`h-full transition-all duration-500 ${remaining > 0 ? "bg-volt" : "bg-grape"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* líneas */}
        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <p className="text-outline font-display text-6xl">VACÍO.</p>
              <p className="text-sm text-ash">Nada por aquí más que ecos. El drop no espera.</p>
              <button
                onClick={onBrowse}
                className="flex items-center gap-2.5 bg-volt px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
              >
                Ir al catálogo <IconArrow className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <ul>
              {lines.map((l) => (
                <li key={l.key} className="flex gap-4 border-b border-seam/70 px-5 py-4">
                  <img src={l.image} alt="" className="h-20 w-20 shrink-0 border border-seam object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold uppercase tracking-wide">{l.name}</p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-ash">
                      {l.color.name}
                      {l.size ? ` · ${l.size}` : ""}
                      {l.closure ? ` · ${l.closure}` : ""}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="flex items-center border border-seam">
                        <button
                          onClick={() => onQty(l.key, -1)}
                          aria-label="Bajar cantidad"
                          className="grid h-8 w-8 place-items-center text-ash transition-colors hover:bg-panel hover:text-bone"
                        >
                          <IconMinus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold tabular-nums">{l.qty}</span>
                        <button
                          onClick={() => onQty(l.key, 1)}
                          aria-label="Subir cantidad"
                          disabled={l.qty >= maxQty(l)}
                          title={l.qty >= maxQty(l) ? "No hay más stock de esta variante" : undefined}
                          className="grid h-8 w-8 place-items-center text-ash transition-colors enabled:hover:bg-panel enabled:hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <IconPlus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-lg">{fmt(l.price * l.qty)}</p>
                        {l.qty >= maxQty(l) && (
                          <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-volt">
                            Stock máx. · {maxQty(l)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(l.key)}
                    aria-label={`Quitar ${l.name}`}
                    className="self-start p-1.5 text-ash transition-colors hover:text-ember"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* pie */}
        {lines.length > 0 && (
          <div className="border-t border-seam px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">Subtotal</span>
              <span className="font-display text-3xl text-volt">{fmt(subtotal)}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-ash">
              El envío se define en el checkout — gratis desde {fmt(STORE.freeShipThreshold)}.
            </p>
            <button
              onClick={onCheckout}
              className="group mt-4 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Finalizar pedido
              <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-ash">
              Pago manual · contra entrega o transferencia
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
