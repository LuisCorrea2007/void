import { useState } from "react";
import Reveal from "./Reveal";
import { IconArrow, IconBolt, IconCash, IconLayers, IconShield, IconSpark, IconTruck } from "./icons";

/* ------------------------- full-width cap banner ------------------------ */
export function CapBanner({ onCaps }: { onCaps: () => void }) {
  return (
    <section className="relative overflow-hidden border-y border-seam bg-coal">
      <div className="pointer-events-none absolute right-0 top-0 h-[380px] w-[380px] rounded-full bg-grape/15 blur-[120px]" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <Reveal>
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-grape">
            <span className="h-px w-10 bg-grape" /> 02 — Headwear first
          </p>
          <h2 className="mt-4 font-display text-6xl leading-[0.88] sm:text-7xl lg:text-8xl">
            CAP GAME
            <br />
            <span className="text-outline">STRONG.</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ash">
            Snapback or strapback, structured or washed — every crown is built on the same
            block and finished by hand. Runs of 200, never more.
          </p>
          <button
            onClick={onCaps}
            className="group mt-7 inline-flex items-center gap-3 border border-grape px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.16em] text-grape transition-all duration-300 hover:bg-grape hover:text-ink"
          >
            Shop all caps
            <IconArrow className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
          </button>
        </Reveal>

        <Reveal delay={120} className="relative">
          <div className="group mx-auto w-full max-w-sm -rotate-3 border border-seam bg-panel p-3 transition-transform duration-500 hover:rotate-0">
            <img
              src="https://image.qwenlm.ai/generated-images/79fa786d-0fc5-447d-a257-020edc6cdc47/_result.png"
              alt="Purple Haze Snapback under studio light"
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute -right-3 top-6 rotate-6 bg-volt px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-ink sm:-right-6">
              200 units only
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------- why-us ledger rows ------------------------- */
const LEDGER = [
  {
    n: "01",
    icon: <IconLayers className="w-6 h-6" />,
    title: "Heavyweight only",
    desc: "240gsm tees, 480gsm fleece. If it doesn't have weight, it doesn't ship.",
  },
  {
    n: "02",
    icon: <IconShield className="w-6 h-6" />,
    title: "Hand-checked QC",
    desc: "Every piece inspected stitch-by-stitch before it hits the polybag.",
  },
  {
    n: "03",
    icon: <IconTruck className="w-6 h-6" />,
    title: "48h dispatch",
    desc: "Order confirmed on WhatsApp today, on a truck tomorrow. Worldwide.",
  },
  {
    n: "04",
    icon: <IconCash className="w-6 h-6" />,
    title: "Pay your way",
    desc: "Cash on delivery or direct bank transfer. No cards, no accounts, no fuss.",
  },
];

export function LedgerStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <Reveal>
        <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-volt">
          <span className="h-px w-10 bg-volt" /> 03 — The standard
        </p>
        <h2 className="mt-3 font-display text-5xl leading-[0.9] sm:text-6xl">
          BUILT <span className="text-outline">DIFFERENT.</span>
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

/* ---------------------------- newsletter band --------------------------- */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  const submit = () => {
    if (!email.includes("@") || email.length < 5) {
      setState("error");
      return;
    }
    setState("done");
  };

  return (
    <section className="border-y border-volt bg-volt text-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <Reveal className="max-w-xl">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em]">
            <IconSpark className="w-3.5 h-3.5" /> First dibs, always
          </p>
          <h2 className="mt-2 font-display text-5xl leading-[0.9] sm:text-6xl">
            GET DROP ALERTS.
          </h2>
          <p className="mt-3 text-sm font-medium text-ink/70">
            One message per drop. List opens 24h early, code STREET10 lives here too.
          </p>
        </Reveal>

        <Reveal delay={100} className="w-full max-w-md">
          {state === "done" ? (
            <div className="animate-pop flex items-center gap-3 border-2 border-ink bg-ink px-5 py-4 text-volt">
              <IconBolt className="w-5 h-5" />
              <p className="text-sm font-bold uppercase tracking-wide">
                You're in. Watch your inbox for Drop 005.
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
                  placeholder="your@email.com"
                  aria-label="Email for drop alerts"
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-bone placeholder:text-ash outline-none"
                />
                <button
                  onClick={submit}
                  className="group flex shrink-0 items-center gap-2 bg-volt px-5 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-bone"
                >
                  Join
                  <IconArrow className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
              {state === "error" && (
                <p className="mt-2 text-xs font-bold uppercase tracking-wide">
                  That email doesn't look right — try again.
                </p>
              )}
            </>
          )}
        </Reveal>
      </div>
    </section>
  );
}
