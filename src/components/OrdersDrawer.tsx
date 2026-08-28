import { useState } from "react";
import { fmt } from "../data/products";
import { ORDER_FLOW, resetDB, type Order, type OrderStatus } from "../lib/db";
import { IconArrow, IconBag, IconClose, IconReceipt } from "./icons";

const STATUS_META: Record<OrderStatus, { label: string; cls: string; desc: string }> = {
  PENDING: {
    label: "Pendiente",
    cls: "border-ash/60 text-bone",
    desc: "Esperando confirmación por WhatsApp",
  },
  CONFIRMED: {
    label: "Confirmado",
    cls: "border-volt text-volt",
    desc: "Stock apartado — pago coordinado",
  },
  SHIPPED: {
    label: "Enviado",
    cls: "border-grape text-volt",
    desc: "En camino — seguimiento enviado",
  },
  DELIVERED: {
    label: "Entregado",
    cls: "border-volt bg-volt text-ink",
    desc: "En tus manos. Rómpela.",
  },
};

/* Historial de pedidos — estados, avance demo y repetir pedido */
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
        aria-label="Cerrar pedidos"
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
            TUS PEDIDOS
            <span className="bg-grape px-2 py-0.5 font-body text-xs font-bold text-bone">
              {orders.length}
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar pedidos"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-grape hover:text-volt"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        {/* lista */}
        <div className="flex-1 overflow-y-auto">
          {orders.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 text-center">
              <IconReceipt className="h-12 w-12 text-seam" />
              <p className="text-outline font-display text-5xl">SIN PEDIDOS.</p>
              <p className="text-sm text-ash">
                Tu historial vive aquí — cada pedido y su estado, guardado en la base de datos.
              </p>
              <button
                onClick={onBrowse}
                className="flex items-center gap-2.5 bg-volt px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
              >
                Hacer un pedido <IconArrow className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <ul className="space-y-4 p-5">
              {orders.map((o) => {
                const step = ORDER_FLOW.indexOf(o.status);
                const meta = STATUS_META[o.status];
                return (
                  <li key={o.id} className="border border-seam bg-panel/50">
                    {/* fila de cabecera */}
                    <div className="flex items-center justify-between gap-3 border-b border-seam px-4 py-3">
                      <div>
                        <p className="font-display text-lg leading-none">{o.id}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ash">
                          {new Date(o.createdAt).toLocaleString("es", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {o.payment === "cod" ? "Contra entrega" : "Transferencia"}
                        </p>
                      </div>
                      <span className={`border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* artículos */}
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

                    {/* pasos de estado */}
                    <div className="border-t border-seam px-4 py-3.5">
                      <div className="flex items-center">
                        {ORDER_FLOW.map((s, i) => (
                          <div key={s} className={`flex items-center ${i < ORDER_FLOW.length - 1 ? "flex-1" : ""}`}>
                            <span
                              title={STATUS_META[s].label}
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

                      {/* acciones */}
                      <div className="mt-3 flex gap-2">
                        {o.status !== "DELIVERED" && (
                          <button
                            onClick={() => onAdvance(o.id)}
                            className="flex-1 border border-dashed border-seam py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ash transition-colors hover:border-volt hover:text-volt"
                          >
                            Demo: avanzar estado
                          </button>
                        )}
                        <button
                          onClick={() => onReorder(o)}
                          className="flex flex-1 items-center justify-center gap-2 border border-seam py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-grape hover:text-volt"
                        >
                          <IconBag className="h-3.5 w-3.5" /> Repetir pedido
                        </button>
                      </div>
                    </div>

                    {/* totales */}
                    <div className="flex items-center justify-between border-t border-seam px-4 py-2.5 text-[12px]">
                      <span className="uppercase tracking-[0.14em] text-ash">
                        Total {o.shipping === 0 && <span className="text-volt">· envío gratis</span>}
                      </span>
                      <span className="font-display text-xl text-volt">{fmt(o.total)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* pie */}
        {orders.length > 0 && (
          <div className="border-t border-seam px-5 py-4 text-center">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ash">
              Los pedidos persisten en la base de datos local
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
              {confirmReset ? "Toca otra vez para borrar todo" : "Borrar datos demo"}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
