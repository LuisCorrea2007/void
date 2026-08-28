import { useState } from "react";
import Reveal from "./Reveal";
import { subscribeEmail } from "../lib/db";
import { IconArrow, IconBolt, IconCash, IconLayers, IconShield, IconSpark, IconTruck } from "./icons";

/* ------------------------- banner de gorras a ancho completo ------------------------ */
export function CapBanner({ onCaps }: { onCaps: () => void }) {
  return (
    <section className="relative overflow-hidden border-y border-seam bg-coal">
      <div className="pointer-events-none absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-grape/25 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
            <span className="h-px w-10 bg-volt" /> 02 — Primero las gorras
          </p>
          <h2 className="mt-4 font-display text-6xl leading-[0.88] sm:text-7xl lg:text-8xl">
            GORRAS
            <br />
            <span className="text-outline">EN SERIO.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">
            Snapback o strapback, estructurada o lavada — cada corona sale del mismo molde y se
            termina a mano. Tiradas de 200, nunca más.
          </p>
          <button
            onClick={onCaps}
            className="group mt-7 inline-flex items-center gap-3 border border-grape px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-volt transition-all duration-300 hover:bg-grape hover:text-bone"
          >
            Ver todas las gorras
            <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </button>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="group mx-auto w-full max-w-sm -rotate-3 border border-seam bg-panel p-3 transition-transform duration-500 hover:rotate-0">
            <img
              src="https://image.qwenlm.ai/generated-images/79fa786d-0fc5-447d-a257-020edc6cdc47/_result.png"
              alt="Snapback Bruma Púrpura bajo luz de estudio"
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute -right-3 top-6 rotate-6 bg-volt px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink sm:-right-6">
              Solo 200 unidades
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- filas ledger "por qué nosotros" ------------------------- */
const LEDGER = [
  {
    n: "01",
    icon: <IconLayers className="h-6 w-6" />,
    title: "Solo peso pesado",
    desc: "Camisetas 240gsm, felpa 480gsm. Si no pesa, no se despacha.",
  },
  {
    n: "02",
    icon: <IconShield className="h-6 w-6" />,
    title: "QC a mano",
    desc: "Cada pieza revisada costura por costura antes de embolsarse.",
  },
  {
    n: "03",
    icon: <IconTruck className="h-6 w-6" />,
    title: "Despacho en 48h",
    desc: "Pedido confirmado hoy por WhatsApp, en camino mañana.",
  },
  {
    n: "04",
    icon: <IconCash className="h-6 w-6" />,
    title: "Paga a tu manera",
    desc: "Contra entrega o transferencia directa. Sin tarjetas ni cuentas.",
  },
];

export function LedgerStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <Reveal>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
          <span className="h-px w-10 bg-volt" /> 03 — El estándar
        </p>
        <h2 className="mt-3 font-display text-5xl leading-[0.9] sm:text-6xl">
          HECHO <span className="text-outline">DISTINTO.</span>
        </h2>
      </Reveal>

      <div className="mt-10 grid divide-y divide-seam border-y border-seam md:grid-cols-4 md:divide-x md:divide-y-0">
        {LEDGER.map((row, i) => (
          <Reveal key={row.n} delay={i * 80}>
            <div className="group h-full px-5 py-7 transition-colors duration-300 hover:bg-coal md:px-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-volt/70 transition-colors group-hover:text-volt">
                  {row.n}
                </span>
                <span className="text-ash transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-volt">
                  {row.icon}
                </span>
              </div>
              <h3 className="mt-6 font-display text-2xl leading-tight">{row.title.toUpperCase()}</h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ash">{row.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- franja de newsletter --------------------------- */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done" | "exists">("idle");

  const submit = () => {
    if (!email.includes("@") || email.length < 5) {
      setState("error");
      return;
    }
    /* se guarda en la tabla subscribers; rechaza duplicados */
    setState(subscribeEmail(email) === "added" ? "done" : "exists");
  };

  return (
    <section className="border-y border-volt bg-volt text-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <Reveal className="max-w-xl">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em]">
            <IconSpark className="h-3.5 w-3.5" /> Primero los del grupo
          </p>
          <h2 className="mt-2 font-display text-5xl leading-[0.9] sm:text-6xl">
            AVISOS DE DROP.
          </h2>
          <p className="mt-3 text-sm font-medium text-ink/70">
            Un mensaje por drop. La lista abre 24h antes y el código CALLE10 vive aquí.
          </p>
        </Reveal>

        <Reveal delay={100} className="w-full max-w-md">
          {state === "done" || state === "exists" ? (
            <div className="animate-pop flex items-center gap-3 border-2 border-ink bg-ink px-5 py-4 text-volt">
              <IconBolt className="h-5 w-5" />
              <p className="text-sm font-bold uppercase tracking-wide">
                {state === "exists"
                  ? "Ya estás en la lista — nos vemos en el Drop 005."
                  : "Dentro. Atento al Drop 005."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex w-full border-2 border-ink bg-ink">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === "error") setState("idle");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="tu@correo.com"
                  aria-label="Correo para avisos de drop"
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-bone placeholder:text-ash outline-none"
                />
                <button
                  onClick={submit}
                  className="group flex shrink-0 items-center gap-2 bg-volt px-5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-bone"
                >
                  Unirme
                  <IconArrow className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              {state === "error" && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide">
                  Ese correo no se ve bien — inténtalo de nuevo.
                </p>
              )}
            </>
          )}
        </Reveal>
      </div>
    </section>
  );
}
