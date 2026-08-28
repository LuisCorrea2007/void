import { useEffect, useMemo, useState } from "react";
import { STORE } from "../data/products";
import { IconArrow, IconBolt, IconSpark } from "./icons";

/* Live countdown to the end of the drop (72h rolling window) */
function useCountdown() {
  const target = useMemo(() => Date.now() + 72 * 3600 * 1000, []);
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function Hero({
  onShopNow,
  onCaps,
}: {
  onShopNow: () => void;
  onCaps: () => void;
}) {
  const countdown = useCountdown();

  return (
    <section id="top" className="bg-grid relative overflow-hidden">
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-volt/10 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-grape/10 blur-[140px]" />
      {/* giant backdrop word */}
      <span
        aria-hidden
        className="text-outline pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[26vw] leading-none opacity-60 lg:text-[19rem]"
      >
        VOLT
      </span>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:pb-32 lg:pt-20">
        {/* -------- left: statement -------- */}
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span className="flex items-center gap-2 border border-seam bg-coal px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-blink bg-volt" />
              {STORE.dropName}
            </span>
            <span className="border border-volt/40 bg-volt/10 px-3 py-1.5 text-volt">
              Ends in <span className="tabular-nums">{countdown}</span>
            </span>
          </div>

          <h1 className="mt-7 font-display text-[17vw] leading-[0.88] sm:text-7xl lg:text-[6.2rem] xl:text-[7.4rem]">
            <span className="block">WEAR THE</span>
            <span className="text-outline block">STREETS.</span>
            <span className="mt-2 flex items-center gap-4">
              <span className="bg-volt px-3 text-ink sm:px-4">LOUD.</span>
              <IconSpark className="w-8 h-8 text-grape sm:w-12 sm:h-12" />
            </span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ash">
            Heavyweight caps, tees and hoodies built for concrete. Small runs,
            hand-checked QC, manual checkout — <span className="text-bone">COD or bank transfer</span>,
            no card required.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={onShopNow}
              className="group flex items-center gap-3 bg-volt px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(200,245,66,0.35)]"
            >
              Shop now
              <IconArrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <button
              onClick={onCaps}
              className="border border-seam px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-bone transition-colors hover:border-grape hover:text-grape"
            >
              Explore caps
            </button>
          </div>

          {/* trust ledger */}
          <dl className="mt-12 grid grid-cols-3 divide-x divide-seam border-y border-seam">
            {[
              ["48H", "Dispatch"],
              ["$120+", "Free shipping"],
              ["COD", "& transfer"],
            ].map(([big, small]) => (
              <div key={small} className="px-3 py-4 sm:px-5">
                <dt className="font-display text-2xl text-bone sm:text-3xl">{big}</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ash sm:text-[11px]">
                  {small}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* -------- right: floating product -------- */}
        <div className="relative lg:col-span-5">
          <div className="animate-float relative mx-auto max-w-sm lg:mt-2">
            <div className="group relative rotate-2 border border-seam bg-coal p-3 transition-transform duration-500 hover:rotate-0">
              <div className="absolute -top-3 left-6 z-10 bg-grape px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                Drop 004
              </div>
              <div className="overflow-hidden">
                <img
                  src="https://image.qwenlm.ai/generated-images/60042518-6020-4e6f-b065-1f7d0c1f5929/_result.png"
                  alt="Volt Classic Snapback floating under neon light"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide">Volt Classic Snapback</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ash">CAP-001 · One size</p>
                </div>
                <p className="font-display text-2xl text-volt">$42</p>
              </div>
            </div>

            {/* rotating stamp */}
            <div className="absolute -left-10 -top-8 hidden h-28 w-28 sm:block lg:-left-14">
              <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
                <defs>
                  <path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <circle cx="50" cy="50" r="49" className="fill-ink stroke-seam" strokeWidth="1" />
                <text className="fill-bone text-[9.5px] font-semibold uppercase" style={{ letterSpacing: "2.6px" }}>
                  <textPath href="#circ">Free shipping worldwide · drop 004 ·</textPath>
                </text>
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                <IconBolt className="w-6 h-6 text-volt" />
              </span>
            </div>

            {/* price sticker */}
            <div className="absolute -bottom-5 -left-4 -rotate-6 border border-seam bg-ink px-4 py-2 sm:-left-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ash">Caps from</p>
              <p className="font-display text-3xl leading-none text-volt">$38</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
