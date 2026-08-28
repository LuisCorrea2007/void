import { useState } from "react";
import { STORE, CATEGORIES, type Category } from "../data/products";
import { IconArrow, IconBolt, IconClose, IconDatabase, IconWhatsApp } from "./icons";

/* Pie: marca gigante, links funcionales, contacto real, políticas y consola SQL */
export default function Footer({
  onNav,
  onOpenConsole,
  onOpenStaff,
}: {
  onNav: (c: Category | "all") => void;
  onOpenConsole: () => void;
  onOpenStaff: () => void;
}) {
  const [policiesOpen, setPoliciesOpen] = useState(false);

  return (
    <footer className="relative overflow-hidden pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        {/* marca gigante */}
        <p
          aria-hidden
          className="text-outline pointer-events-none select-none whitespace-nowrap font-display text-[18vw] leading-[0.85] lg:text-[11rem]"
        >
          VLT/STRT
        </p>

        <div className="mt-10 grid gap-10 border-t border-seam pt-10 md:grid-cols-12">
          {/* marca */}
          <div className="md:col-span-5">
            <p className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center bg-volt text-ink">
                <IconBolt className="h-4 w-4" />
              </span>
              <span className="font-display text-lg">
                VLT<span className="text-volt">/</span>STRT
              </span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              Marca independiente de streetwear. Gorras y ropa pesada en tiradas limitadas —
              vendidas a la antigua: tú escribes, confirmamos y despachamos.
            </p>
            {/* chips de pago */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["Contra entrega", "Transferencia bancaria", "Código QR"].map((p) => (
                <span
                  key={p}
                  className="border border-seam px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ash"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* tienda */}
          <div className="md:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">Tienda</p>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNav(c.id)}
                    className="group flex items-center gap-2 text-sm text-ash transition-colors hover:text-bone"
                  >
                    <span className="h-px w-0 bg-volt transition-all duration-300 group-hover:w-4" />
                    {c.label === "Todo" ? "Todo el catálogo" : c.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setPoliciesOpen(true)}
                  className="group flex items-center gap-2 text-sm text-ash transition-colors hover:text-bone"
                >
                  <span className="h-px w-0 bg-volt transition-all duration-300 group-hover:w-4" />
                  Envíos y políticas
                </button>
              </li>
            </ul>
          </div>

          {/* cómo funciona */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">Cómo funciona</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ash">
              <li>1. Eliges tus piezas</li>
              <li>2. Checkout → WhatsApp</li>
              <li>3. Contra entrega o transferencia</li>
              <li>4. Despacho en 48h</li>
            </ul>
          </div>

          {/* contacto */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">Contacto</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2 text-ash transition-colors hover:text-volt"
                >
                  <IconWhatsApp className="h-4 w-4" /> {STORE.whatsappDisplay}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${STORE.email}`}
                  className="group flex items-center gap-2 text-ash transition-colors hover:text-volt"
                >
                  <IconArrow className="h-3.5 w-3.5 -rotate-45 transition-transform group-hover:translate-x-0.5" />
                  {STORE.email}
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenStaff}
                  className="group flex items-center gap-2 text-ash transition-colors hover:text-volt"
                >
                  <IconBolt className="h-3.5 w-3.5" />
                  Panel de Staff
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* barra inferior */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-seam py-6 text-[11px] uppercase tracking-[0.18em] text-ash">
          <p>© 2026 VLT/STRT — Hecho fuerte, despachado rápido.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenConsole}
              className="group flex items-center gap-2 transition-colors hover:text-volt"
              title="Abrir la consola SQL en vivo"
            >
              <IconDatabase className="h-3.5 w-3.5" />
              Consola SQL
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group flex items-center gap-2 transition-colors hover:text-volt"
            >
              Volver arriba
              <IconArrow className="h-3.5 w-3.5 -rotate-90 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {policiesOpen && <PoliciesModal onClose={() => setPoliciesOpen(false)} />}
    </footer>
  );
}

/* ------------------------------- políticas -------------------------------- */
function PoliciesModal({ onClose }: { onClose: () => void }) {
  const sections: { title: string; body: string[] }[] = [
    {
      title: "Envíos",
      body: [
        "Despachamos en 48 horas hábiles desde la confirmación por WhatsApp.",
        `Envío fijo de $${STORE.flatShip} a todo el país — gratis en pedidos desde $${STORE.freeShipThreshold}.`,
        "Recibirás la guía de seguimiento por WhatsApp apenas salga el paquete.",
      ],
    },
    {
      title: "Pagos",
      body: [
        "Trabajamos 100% manual: contra entrega (efectivo al mensajero) o transferencia bancaria directa.",
        `Transferencias a ${STORE.bank.name} · ${STORE.bank.account} (a nombre de ${STORE.bank.holder}).`,
        "No pedimos tarjetas ni datos bancarios sensibles por chat.",
      ],
    },
    {
      title: "Cambios y devoluciones",
      body: [
        "Tienes 7 días desde la entrega para cambio de talla si la pieza está sin uso y con etiquetas.",
        "Piezas de última llamada y tiradas limitadas no tienen devolución, solo cambio por stock disponible.",
        "Escríbenos con tu número de pedido (VLT-XXXXXX) y lo resolvemos el mismo día.",
      ],
    },
    {
      title: "Privacidad",
      body: [
        "Tus datos (nombre, WhatsApp y dirección) se usan únicamente para coordinar tu pedido.",
        "Todo vive en la base de datos local de esta tienda — no vendemos ni compartimos información.",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-[72] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <button aria-label="Cerrar políticas" onClick={onClose} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
      <div className="animate-rise relative max-h-[88dvh] w-full max-w-lg overflow-y-auto border border-seam bg-coal p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-3xl">POLÍTICAS<span className="text-outline">.</span></h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 space-y-5">
          {sections.map((s) => (
            <section key={s.title}>
              <h4 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-volt">
                <IconBolt className="h-3.5 w-3.5" /> {s.title}
              </h4>
              <ul className="mt-2 space-y-1.5">
                {s.body.map((b, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-ash">• {b}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-6 border-t border-seam pt-4 text-[11px] uppercase tracking-[0.16em] text-ash">
          Dudas: <a className="text-volt hover:underline" href={`https://wa.me/${STORE.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {STORE.whatsappDisplay}</a>
          {" · "}
          <a className="text-volt hover:underline" href={`mailto:${STORE.email}`}>{STORE.email}</a>
        </p>
      </div>
    </div>
  );
}
