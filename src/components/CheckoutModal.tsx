import { useMemo, useState } from "react";
import { STORE, fmt, type CartLine } from "../data/products";
import { validatePromo, type Order } from "../lib/db";
import { IconArrow, IconBank, IconCash, IconCheck, IconClose, IconCopy, IconWhatsApp } from "./icons";

type Payment = "cod" | "transfer";
type Errors = { name?: string; whatsapp?: string; address?: string };

/* Checkout manual — nombre, WhatsApp, dirección + contra entrega / transferencia.
   Al confirmar, el pedido se guarda en la tabla orders y el stock se descuenta. */
export default function CheckoutModal({
  lines,
  subtotal,
  onClose,
  onPlace,
  onShowOrders,
  onComplete,
}: {
  lines: CartLine[];
  subtotal: number;
  onClose: () => void;
  onPlace: (customer: { name: string; whatsapp: string; address: string }, payment: Payment, discountPct: number) => Order;
  onShowOrders: () => void;
  onComplete: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<Payment>("cod");
  const [errors, setErrors] = useState<Errors>({});

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; pct: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const discount = promo ? Math.round(subtotal * promo.pct) / 100 : 0;
  const discounted = subtotal - discount;
  const shipping = discounted >= STORE.freeShipThreshold ? 0 : STORE.flatShip;
  const total = discounted + shipping;

  const applyPromo = () => {
    if (!promoInput.trim()) return;
    const res = validatePromo(promoInput);
    if (res.valid) {
      setPromo({ code: promoInput.trim().toUpperCase(), pct: res.pct });
      setPromoMsg({ ok: true, text: `Código aplicado: −${res.pct}%` });
    } else {
      setPromoMsg({ ok: false, text: "Ese código no existe en la tabla promos." });
    }
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Dinos quién hace el pedido.";
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) e.whatsapp = "Ingresa un WhatsApp válido (solo números).";
    if (address.trim().length < 10) e.address = "Calle, número, ciudad y referencia, por favor.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = () => {
    if (!validate()) return;
    setOrder(onPlace({ name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim() }, payment, promo?.pct ?? 0));
  };

  const waLink = useMemo(() => {
    if (!order) return "#";
    const items = order.items
      .map(
        (l, i) =>
          `${i + 1}. ${l.qty}x ${l.name} (${l.color.name}${l.size ? `, ${l.size}` : ""}${l.closure ? `, ${l.closure}` : ""}) — ${fmt(l.price * l.qty)}`,
      )
      .join("\n");
    const text = [
      `*NUEVO PEDIDO — ${order.id}*`,
      "-------------------------",
      items,
      "-------------------------",
      `Subtotal: ${fmt(order.subtotal)}`,
      order.discount > 0 ? `Descuento (código promo): −${fmt(order.discount)}` : "",
      `Envío: ${order.shipping === 0 ? "GRATIS" : fmt(order.shipping)}`,
      `*TOTAL: ${fmt(order.total)}*`,
      `Pago: ${order.payment === "cod" ? "CONTRA ENTREGA" : "TRANSFERENCIA BANCARIA"}`,
      "-------------------------",
      `Nombre: ${order.customer.name}`,
      `WhatsApp: ${order.customer.whatsapp}`,
      `Dirección: ${order.customer.address}`,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
  }, [order]);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(STORE.bank.account.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const field = (err?: string) =>
    `w-full border bg-panel px-4 py-3 text-sm text-bone placeholder:text-ash/60 outline-none transition-colors ${
      err ? "border-ember" : "border-seam focus:border-volt"
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button aria-label="Cerrar checkout" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      <div className="animate-rise relative max-h-[94dvh] w-full max-w-xl overflow-y-auto border border-seam bg-coal sm:max-h-[88dvh]">
        <button
          onClick={onClose}
          aria-label="Cerrar checkout"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-seam bg-ink/80 text-bone transition-colors hover:border-volt hover:text-volt"
        >
          <IconClose className="h-4 w-4" />
        </button>

        {!order ? (
          <div className="p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">02 — Checkout manual</p>
            <h3 className="mt-2 font-display text-4xl leading-[0.95]">
              CIÉRRALO<span className="text-outline">.</span>
            </h3>
            <p className="mt-3 text-sm text-ash">
              Sin tarjetas ni registros. Deja tus datos, elige cómo pagar — confirmamos stock y total
              por WhatsApp en menos de 2 horas.
            </p>

            {/* resumen */}
            <div className="mt-6 border border-seam bg-panel/60">
              <ul className="max-h-36 divide-y divide-seam/60 overflow-y-auto">
                {lines.map((l) => (
                  <li key={l.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]">
                    <span className="min-w-0 truncate">
                      <span className="font-bold">{l.qty}×</span> {l.name}
                      <span className="text-ash">
                        {" "}· {l.color.name}
                        {l.size ? `, ${l.size}` : ""}
                        {l.closure ? `, ${l.closure}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{fmt(l.price * l.qty)}</span>
                  </li>
                ))}
              </ul>

              {/* código promocional */}
              <div className="border-t border-seam px-4 py-3">
                {promo ? (
                  <p className="flex items-center gap-2 text-[13px] font-bold text-volt">
                    <IconCheck className="h-4 w-4" /> {promo.code} aplicado (−{promo.pct}%)
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoMsg(null); }}
                      onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                      placeholder="Código promo (prueba CALLE10)"
                      className="min-w-0 flex-1 border border-dashed border-seam bg-ink px-3 py-2 text-[13px] uppercase tracking-wide text-bone placeholder:normal-case placeholder:tracking-normal placeholder:text-ash/50 outline-none focus:border-volt"
                    />
                    <button
                      onClick={applyPromo}
                      className="shrink-0 border border-seam px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-bone transition-colors hover:border-volt hover:text-volt"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
                {promoMsg && !promo && (
                  <p className={`mt-1.5 text-[11px] font-semibold ${promoMsg.ok ? "text-volt" : "text-ember"}`}>{promoMsg.text}</p>
                )}
              </div>

              <div className="space-y-1 border-t border-seam px-4 py-3 text-[13px]">
                <p className="flex justify-between text-ash">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </p>
                {discount > 0 && (
                  <p className="flex justify-between font-semibold text-volt">
                    <span>Descuento ({promo?.code})</span>
                    <span className="tabular-nums">−{fmt(discount)}</span>
                  </p>
                )}
                <p className="flex justify-between text-ash">
                  <span>Envío</span>
                  <span className={shipping === 0 ? "font-bold text-volt" : "tabular-nums"}>
                    {shipping === 0 ? "GRATIS" : fmt(shipping)}
                  </span>
                </p>
                <p className="flex justify-between pt-1 font-display text-2xl">
                  <span>TOTAL</span>
                  <span className="text-volt">{fmt(total)}</span>
                </p>
              </div>
            </div>

            {/* formulario */}
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="co-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  Nombre completo
                </label>
                <input
                  id="co-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Luis Eduardo"
                  className={field(errors.name)}
                />
                {errors.name && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="co-wa" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  Número de WhatsApp
                </label>
                <input
                  id="co-wa"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  inputMode="tel"
                  placeholder="Ej: 0994 327 349"
                  className={field(errors.whatsapp)}
                />
                {errors.whatsapp && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.whatsapp}</p>}
              </div>

              <div>
                <label htmlFor="co-addr" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  Dirección de envío
                </label>
                <textarea
                  id="co-addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Calle, número, sector, ciudad y referencia"
                  className={`${field(errors.address)} resize-none`}
                />
                {errors.address && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.address}</p>}
              </div>

              {/* método de pago */}
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ash">Método de pago</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      { id: "cod", label: "Contra entrega", sub: "Pagas al mensajero en tu puerta", icon: <IconCash className="h-5 w-5" /> },
                      { id: "transfer", label: "Transferencia directa", sub: "Transfieres al confirmar", icon: <IconBank className="h-5 w-5" /> },
                    ] as const
                  ).map((opt) => {
                    const active = payment === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setPayment(opt.id)}
                        className={`flex items-start gap-3 border px-4 py-3.5 text-left transition-all duration-200 ${
                          active ? "border-volt bg-volt/10" : "border-seam hover:border-ash"
                        }`}
                      >
                        <span className={`mt-0.5 ${active ? "text-volt" : "text-ash"}`}>{opt.icon}</span>
                        <span>
                          <span className={`flex items-center gap-2 text-sm font-bold ${active ? "text-volt" : "text-bone"}`}>
                            {opt.label}
                            {active && <IconCheck className="h-3.5 w-3.5" />}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ash">{opt.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {payment === "transfer" && (
                  <div className="animate-rise mt-2.5 flex items-center justify-between gap-3 border border-grape/60 bg-grape/15 px-4 py-3">
                    <div className="text-[13px]">
                      <p className="font-bold text-volt">{STORE.bank.name}</p>
                      <p className="tabular-nums text-bone">{STORE.bank.account}</p>
                      <p className="text-[11px] text-ash">a nombre de {STORE.bank.holder}</p>
                    </div>
                    <button
                      onClick={copyAccount}
                      className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                        copied ? "border-volt bg-volt text-ink" : "border-seam text-bone hover:border-volt hover:text-volt"
                      }`}
                    >
                      {copied ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={placeOrder}
              className="group mt-7 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Confirmar pedido — {fmt(total)}
              <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-ash">
              Respondemos por WhatsApp de 10:00 a 22:00, todos los días
            </p>
          </div>
        ) : (
          /* ------------------------- estado de éxito ------------------------- */
          <div className="p-6 text-center sm:p-10">
            <span className="mx-auto grid h-16 w-16 animate-pop place-items-center bg-volt text-ink">
              <IconCheck className="h-8 w-8" />
            </span>
            <h3 className="mt-5 font-display text-4xl leading-[0.95] sm:text-5xl">
              PEDIDO <span className="text-outline-volt">EN MARCHA.</span>
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-ash">
              <span className="font-bold text-bone">{order.id}</span> quedó guardado en la tabla de pedidos con
              stock descontado. Un último paso: mándanoslo por WhatsApp para confirmar.
            </p>

            <ol className="mx-auto mt-6 max-w-sm space-y-2 text-left">
              {[
                "Toca el botón de abajo — tu pedido se abre en WhatsApp, listo para enviar.",
                order.payment === "cod"
                  ? "Confirmamos stock y pagas en efectivo en tu puerta."
                  : "Confirmamos stock, transfieres y despachamos el mismo día.",
                "Despacho en 48h con seguimiento por WhatsApp.",
              ].map((step, i) => (
                <li key={i} className="flex gap-3 border border-seam bg-panel/60 px-4 py-3 text-[13px]">
                  <span className="font-display text-lg text-volt">{i + 1}</span>
                  <span className="text-bone/85">{step}</span>
                </li>
              ))}
            </ol>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="mt-7 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.16em] text-ink transition-all duration-200 hover:brightness-110"
            >
              <IconWhatsApp className="h-5 w-5" />
              Enviar pedido por WhatsApp
            </a>
            <button
              onClick={onShowOrders}
              className="mt-3 w-full border border-seam py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-bone transition-colors hover:border-grape hover:text-volt"
            >
              Ver historial de pedidos
            </button>
            <button
              onClick={onComplete}
              className="mt-2 w-full py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ash transition-colors hover:text-bone"
            >
              Volver a la tienda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
