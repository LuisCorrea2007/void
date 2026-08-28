import { useMemo, useState } from "react";
import { STORE, fmt, type CartLine } from "../data/products";
import { validatePromo, type Order } from "../lib/db";
import { IconArrow, IconBank, IconBolt, IconCash, IconCheck, IconClose, IconCopy, IconReceipt, IconWhatsApp } from "./icons";

export type Payment = "cod" | "transfer";
type Errors = { name?: string; whatsapp?: string; address?: string };

/* Manual checkout — details + payment route + promo code (checked in the DB) */
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
  onPlace: (customer: Order["customer"], payment: Payment, discountPct: number) => Order;
  onShowOrders: () => void;
  onComplete: () => void;
}) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<Payment>("cod");
  const [errors, setErrors] = useState<Errors>({});
  const [copied, setCopied] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  /* promo code */
  const [code, setCode] = useState("");
  const [promo, setPromo] = useState<{ pct: number; note: string } | null>(null);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const discountPct = promo?.pct ?? 0;
  const discount = Math.round(subtotal * discountPct) / 100;
  const discounted = Math.round((subtotal - discount) * 100) / 100;
  const shipping = discounted >= STORE.freeShipThreshold ? 0 : STORE.flatShip;
  const total = Math.round((discounted + shipping) * 100) / 100;

  const applyPromo = () => {
    if (!code.trim()) return;
    const res = validatePromo(code);
    if (res.valid) {
      setPromo({ pct: res.pct, note: res.note });
      setPromoMsg({ ok: true, text: `Code applied — ${res.pct}% off your subtotal.` });
    } else {
      setPromo(null);
      setPromoMsg({ ok: false, text: "Invalid code — not found in the promos table." });
    }
  };

  const waLink = useMemo(() => {
    if (!placed) return "#";
    const items = placed.items
      .map(
        (l, i) =>
          `${i + 1}. ${l.qty}x ${l.name} (${l.color.name}${l.size ? `, ${l.size}` : ""}${l.closure ? `, ${l.closure}` : ""}) — ${fmt(l.price * l.qty)}`,
      )
      .join("\n");
    const text = [
      `*NEW ORDER — ${placed.id}*`,
      "-------------------------",
      items,
      "-------------------------",
      `Subtotal: ${fmt(placed.subtotal)}`,
      placed.discount > 0 ? `Discount: -${fmt(placed.discount)}` : "",
      `Shipping: ${placed.shipping === 0 ? "FREE" : fmt(placed.shipping)}`,
      `*TOTAL: ${fmt(placed.total)}*`,
      `Payment: ${placed.payment === "cod" ? "CASH ON DELIVERY" : "DIRECT BANK TRANSFER"}`,
      "-------------------------",
      `Name: ${placed.customer.name}`,
      `WhatsApp: ${placed.customer.whatsapp}`,
      `Address: ${placed.customer.address}`,
    ].filter(Boolean).join("\n");
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
  }, [placed]);

  const validate = (): boolean => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Tell us who's ordering.";
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) e.whatsapp = "Enter a valid WhatsApp number (digits only).";
    if (address.trim().length < 10) e.address = "Full street, city and postcode, please.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setPlaced(onPlace({ name: name.trim(), whatsapp: whatsapp.trim(), address: address.trim() }, payment, discountPct));
  };

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
      <button aria-label="Close checkout" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />

      <div className="animate-rise relative max-h-[94dvh] w-full max-w-xl overflow-y-auto border border-seam bg-coal sm:max-h-[88dvh]">
        <button
          onClick={onClose}
          aria-label="Close checkout"
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-seam bg-ink/80 text-bone transition-colors hover:border-volt hover:text-volt"
        >
          <IconClose className="w-4 h-4" />
        </button>

        {!placed ? (
          <div className="p-5 sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">Manual checkout</p>
            <h3 className="mt-2 font-display text-4xl leading-[0.95]">
              LOCK IT <span className="text-outline">IN.</span>
            </h3>
            <p className="mt-3 text-sm text-ash">
              No cards, no gatekeeping. Drop your details, pick a payment route — we confirm stock and
              total on WhatsApp within 2 hours.
            </p>

            {/* order summary */}
            <div className="mt-6 border border-seam bg-panel/60">
              <ul className="max-h-32 divide-y divide-seam/60 overflow-y-auto">
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

              {/* promo code */}
              <div className="border-t border-seam px-4 py-3">
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); setPromoMsg(null); }}
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                    placeholder="Promo code — try STREET10"
                    aria-label="Promo code"
                    className="min-w-0 flex-1 border border-seam bg-ink px-3 py-2.5 font-mono text-[13px] uppercase tracking-[0.1em] text-volt placeholder:font-body placeholder:normal-case placeholder:tracking-normal placeholder:text-ash/60 outline-none focus:border-volt"
                  />
                  <button
                    onClick={applyPromo}
                    className="shrink-0 border border-seam px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-volt hover:text-volt"
                  >
                    Apply
                  </button>
                </div>
                {promoMsg && (
                  <p className={`mt-2 text-[12px] font-semibold ${promoMsg.ok ? "text-volt" : "text-ember"}`}>
                    {promoMsg.ok ? "✓ " : "✗ "}{promoMsg.text}
                  </p>
                )}
              </div>

              <div className="space-y-1 border-t border-seam px-4 py-3 text-[13px]">
                <p className="flex justify-between text-ash">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </p>
                {discount > 0 && (
                  <p className="flex justify-between font-semibold text-volt">
                    <span>Discount ({discountPct}%)</span>
                    <span className="tabular-nums">−{fmt(discount)}</span>
                  </p>
                )}
                <p className="flex justify-between text-ash">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "font-bold text-volt" : "tabular-nums"}>
                    {shipping === 0 ? "FREE" : fmt(shipping)}
                  </span>
                </p>
                <p className="flex justify-between pt-1 font-display text-2xl">
                  <span>TOTAL</span>
                  <span className="text-volt">{fmt(total)}</span>
                </p>
              </div>
            </div>

            {/* form */}
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="co-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  Full name
                </label>
                <input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rico Mahendra" className={field(errors.name)} />
                {errors.name && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="co-wa" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  WhatsApp number
                </label>
                <input id="co-wa" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} inputMode="tel" placeholder="e.g. 0812 3456 7890" className={field(errors.whatsapp)} />
                {errors.whatsapp && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.whatsapp}</p>}
              </div>

              <div>
                <label htmlFor="co-addr" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.18em] text-ash">
                  Shipping address
                </label>
                <textarea id="co-addr" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Street, number, district, city, postcode" className={`${field(errors.address)} resize-none`} />
                {errors.address && <p className="mt-1.5 text-xs font-semibold text-ember">{errors.address}</p>}
              </div>

              {/* payment method */}
              <div>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ash">Payment method</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      { id: "cod", label: "Cash on Delivery", sub: "Pay the courier at your door", icon: <IconCash className="w-5 h-5" /> },
                      { id: "transfer", label: "Direct Bank Transfer", sub: "Transfer after we confirm", icon: <IconBank className="w-5 h-5" /> },
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
                            {active && <IconCheck className="w-3.5 h-3.5" />}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-ash">{opt.sub}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {payment === "transfer" && (
                  <div className="animate-rise mt-2.5 flex items-center justify-between gap-3 border border-grape/50 bg-grape/10 px-4 py-3">
                    <div className="text-[13px]">
                      <p className="font-bold text-grape">{STORE.bank.name}</p>
                      <p className="tabular-nums text-bone">{STORE.bank.account}</p>
                      <p className="text-[11px] text-ash">a.n. {STORE.bank.holder}</p>
                    </div>
                    <button
                      onClick={copyAccount}
                      className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                        copied ? "border-volt bg-volt text-ink" : "border-seam text-bone hover:border-grape hover:text-grape"
                      }`}
                    >
                      {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={submit}
              className="group mt-7 flex w-full items-center justify-center gap-3 bg-volt py-4 text-[13px] font-bold uppercase tracking-[0.18em] text-ink transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
            >
              Place order — {fmt(total)}
              <IconArrow className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="mt-3 text-center text-[11px] uppercase tracking-[0.14em] text-ash">
              Saved to the orders table · we reply on WhatsApp 10:00–22:00
            </p>
          </div>
        ) : (
          /* --------------------------- success state --------------------------- */
          <div className="p-6 text-center sm:p-10">
            <span className="mx-auto grid h-16 w-16 animate-pop place-items-center bg-volt text-ink">
              <IconCheck className="w-8 h-8" />
            </span>
            <h3 className="mt-5 font-display text-4xl leading-[0.95] sm:text-5xl">
              ORDER <span className="text-outline-volt">LOCKED.</span>
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm text-ash">
              <span className="font-bold text-bone">{placed.id}</span> is written to the database and
              reserved for 3 hours. One last step — send it to us on WhatsApp.
            </p>

            <ol className="mx-auto mt-6 max-w-sm space-y-2 text-left">
              {[
                "Tap the button below — your order opens in WhatsApp, ready to send.",
                placed.payment === "cod"
                  ? "We confirm stock, you pay cash at your door."
                  : "We confirm stock, you transfer, we ship same day.",
                "Dispatch within 48h — track the status from the orders panel.",
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
              <IconWhatsApp className="w-5 h-5" />
              Send order via WhatsApp
            </a>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onShowOrders}
                className="flex items-center justify-center gap-2 border border-seam py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-grape hover:text-grape"
              >
                <IconReceipt className="w-4 h-4" /> My orders
              </button>
              <button
                onClick={onComplete}
                className="border border-seam py-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-bone transition-colors hover:border-volt hover:text-volt"
              >
                Keep shopping
              </button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-ash">
              <IconBolt className="w-3 h-3 text-volt" /> stock decremented in real time
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
