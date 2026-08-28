import { STORE, fmt, type CartLine } from "../data/products";
import { IconArrow, IconClose, IconMinus, IconPlus, IconTrash, IconTruck } from "./icons";

/* Slide-out cart: qty steppers, free-shipping meter, subtotal, checkout CTA */
export default function CartDrawer({
  open,
  lines,
  subtotal,
  onClose,
  onQty,
  onRemove,
  onCheckout,
  onBrowse,
}: {
  open: boolean;
  lines: CartLine[];
  subtotal: number;
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
      {/* backdrop */}
      <button
        aria-label="Close cart"
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
        {/* header */}
        <div className="flex items-center justify-between border-b border-seam px-5 py-4">
          <h2 className="flex items-baseline gap-3 font-display text-2xl">
            YOUR CART
            <span className="bg-volt px-2 py-0.5 font-body text-xs font-bold text-ink">{count}</span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close cart"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* free-shipping meter */}
        {lines.length > 0 && (
          <div className="border-b border-seam px-5 py-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
              <IconTruck className="w-4 h-4 text-volt" />
              {remaining > 0 ? (
                <span className="text-ash">
                  <span className="text-volt">{fmt(remaining)}</span> away from free shipping
                </span>
              ) : (
                <span className="text-volt">Free shipping unlocked</span>
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

        {/* lines */}
        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <p className="text-outline font-display text-6xl">EMPTY.</p>
              <p className="text-sm text-ash">Nothing in here but echoes. The drop won't wait.</p>
              <button
                onClick={onBrowse}
                className="flex items-center gap-2.5 bg-volt px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
              >
                Hit the catalog <IconArrow className="w-4 h-4" />
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
                          aria-label="Decrease quantity"
                          className="grid h-8 w-8 place-items-center text-ash transition-colors hover:bg-panel hover:text-bone"
                        >
                          <IconMinus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-[13px] font-bold tabular-nums">{l.qty}</span>
                        <button
                          onClick={() => onQty(l.key, 1)}
                          aria-label="Increase quantity"
                          className="grid h-8 w-8 place-items-center text-ash transition-colors hover:bg-panel hover:text-bone"
                        >
                          <IconPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-display text-lg">{fmt(l.price * l.qty)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(l.key)}
                    aria-label={`Remove ${l.name}`}
                    className="self-start p-1.5 text-ash transition-colors hover:text-ember"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        {lines.length > 0 && (
          <div className="border-t border-seam px-5 py-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ash">Subtotal</span>
              <span className="font-display text-3xl text-volt">{fmt(subtotal)}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-ash">
              Shipping settled at checkout — free over {fmt(STORE.freeShipThreshold)}.
            </p>
            <button
              onClick={onCheckout}
              className="group mt-4 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Checkout
              <IconArrow className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.16em] text-ash">
              Manual payment · COD or direct bank transfer
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
