import { useState } from "react";
import { fmt } from "../data/products";
import { ORDER_FLOW, resetDB, type Order, type OrderStatus } from "../lib/db";
import { IconArrow, IconBag, IconClose, IconReceipt } from "./icons";

const STATUS_META: Record<OrderStatus, { label: string; cls: string; desc: string }> = {
  PENDING: {
    label: "Pending",
    cls: "border-ash/60 text-bone",
    desc: "Waiting for WhatsApp confirmation",
  },
  CONFIRMED: {
    label: "Confirmed",
    cls: "border-volt text-volt",
    desc: "Stock locked — payment arranged",
  },
  SHIPPED: {
    label: "Shipped",
    cls: "border-grape text-grape",
    desc: "On the way — tracking sent to you",
  },
  DELIVERED: {
    label: "Delivered",
    cls: "border-volt bg-volt text-ink",
    desc: "In your hands. Rock it loud.",
  },
};

/* Orders history slide-over — status timeline, demo progression, reorder */
export default function OrdersDrawer({
  open,
  orders,
  onClose,
  onAdvance,
  onReorder,
  onBrowse,
}: {
  open: boolean;
  orders: Order[];
  onClose: () => void;
  onAdvance: (id: string) => void;
  onReorder: (o: Order) => void;
  onBrowse: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <>
      <button
        aria-label="Close orders"
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
            YOUR ORDERS
            <span className="bg-grape px-2 py-0.5 font-body text-xs font-bold text-ink">
              {orders.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close orders"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-grape hover:text-grape"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <IconReceipt className="w-12 h-12 text-seam" />
              <p className="text-outline font-display text-5xl">NO ORDERS.</p>
              <p className="text-sm text-ash">
                Your history lives here — every order, every status, saved on this device.
              </p>
              <button
                onClick={onBrowse}
                className="flex items-center gap-2.5 bg-volt px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
              >
                Start an order <IconArrow className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <ul className="space-y-4 p-5">
              {orders.map((o) => {
                const step = ORDER_FLOW.indexOf(o.status);
                const meta = STATUS_META[o.status];
                return (
                  <li key={o.id} className="border border-seam bg-panel/50">
                    {/* header row */}
                    <div className="flex items-center justify-between gap-3 border-b border-seam px-4 py-3">
                      <div>
                        <p className="font-display text-lg leading-none">{o.id}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ash">
                          {new Date(o.createdAt).toLocaleString(undefined, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {o.payment === "cod" ? "Cash on delivery" : "Bank transfer"}
                        </p>
                      </div>
                      <span className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* items */}
                    <ul className="divide-y divide-seam/60">
                      {o.items.map((it, i) => (
                        <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <img src={it.image} alt="" className="h-11 w-11 border border-seam object-cover" />
                          <span className="min-w-0 flex-1 text-[13px]">
                            <span className="block truncate font-bold">{it.qty}× {it.name}</span>
                            <span className="text-[11px] uppercase tracking-wide text-ash">
                              {it.color.name}
                              {it.size ? ` · ${it.size}` : ""}
                              {it.closure ? ` · ${it.closure}` : ""}
                            </span>
                          </span>
                          <span className="text-[13px] font-semibold tabular-nums">
                            {fmt(it.price * it.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* status stepper */}
                    <div className="border-t border-seam px-4 py-3.5">
                      <div className="flex items-center">
                        {ORDER_FLOW.map((s, i) => (
                          <div key={s} className={`flex items-center ${i < ORDER_FLOW.length - 1 ? "flex-1" : ""}`}>
                            <span
                              title={s}
                              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                                i <= step
                                  ? i === step
                                    ? "border-volt bg-volt"
                                    : "border-volt bg-volt/40"
                                  : "border-seam bg-transparent"
                              }`}
                            />
                            {i < ORDER_FLOW.length - 1 && (
                              <span className={`mx-1 h-0.5 flex-1 transition-colors ${i < step ? "bg-volt" : "bg-seam"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-ash">{meta.desc}</p>

                      {/* actions */}
                      <div className="mt-3 flex gap-2">
                        {o.status !== "DELIVERED" && (
                          <button
                            onClick={() => onAdvance(o.id)}
                            className="flex-1 border border-dashed border-seam py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-volt hover:text-volt"
                          >
                            Demo: advance status
                          </button>
                        )}
                        <button
                          onClick={() => onReorder(o)}
                          className="flex flex-1 items-center justify-center gap-2 border border-seam py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-grape hover:text-grape"
                        >
                          <IconBag className="w-3.5 h-3.5" /> Reorder
                        </button>
                      </div>
                    </div>

                    {/* totals */}
                    <div className="flex items-center justify-between border-t border-seam px-4 py-2.5 text-[12px]">
                      <span className="uppercase tracking-[0.14em] text-ash">
                        Total {o.shipping === 0 && <span className="text-volt">· free ship</span>}
                      </span>
                      <span className="font-display text-xl text-volt">{fmt(o.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* footer */}
        {orders.length > 0 && (
          <div className="border-t border-seam px-5 py-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ash">
              Orders persist on this device via local database
            </p>
            <button
              onClick={() => {
                if (!confirmReset) {
                  setConfirmReset(true);
                  setTimeout(() => setConfirmReset(false), 2600);
                  return;
                }
                resetDB();
                setConfirmReset(false);
              }}
              className={`mt-2 text-[10px] font-bold uppercase tracking-[0.16em] underline-offset-4 transition-colors hover:underline ${
                confirmReset ? "text-ember" : "text-ash hover:text-bone"
              }`}
            >
              {confirmReset ? "Tap again to wipe all demo data" : "Reset demo data"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
