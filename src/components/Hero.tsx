import { useEffect, useMemo, useState } from "react";
import { STORE } from "../data/products";
import { IconArrow, IconBolt, IconSpark } from "./icons";

/* Cuenta regresiva en vivo (ventana rodante de 72h) */
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
      {/* glows ambientales */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-plum/25 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[460px] w-[460px] rounded-full bg-grape/20 blur-[140px]" />
      {/* palabra gigante de fondo */}
      <span
        aria-hidden
        className="text-outline pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-display text-[26vw] leading-none opacity-60 lg:text-[19rem]"
      >
        CALLE
      </span>

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-12 sm:px-6 lg:grid-cols-12 lg:gap-6 lg:pb-32 lg:pt-20">
        {/* -------- izquierda: manifiesto -------- */}
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
            <span className="flex items-center gap-2 border border-seam bg-coal px-3 py-1.5">
              <span className="h-1.5 w-1.5 animate-blink bg-volt" />
              {STORE.dropName}
            </span>
            <span className="border border-volt/40 bg-grape/20 px-3 py-1.5 text-volt">
              Termina en <span className="tabular-nums">{countdown}</span>
            </span>
          </div>

          <h1 className="mt-7 font-display text-[17vw] leading-[0.88] sm:text-7xl lg:text-[6.2rem] xl:text-[7.4rem]">
            <span className="block">VISTE LA</span>
            <span className="text-outline block">CALLE.</span>
            <span className="mt-2 flex items-center gap-4">
              <span className="bg-volt px-3 text-ink sm:px-4">FUERTE.</span>
              <IconSpark className="h-8 w-8 text-grape sm:h-12 sm:w-12" />
            </span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ash">
            Gorras, camisetas y hoodies pesados, hechos para el concreto. Tiradas cortas,
            QC a mano y checkout manual — <span className="text-bone">contra entrega o transferencia</span>,
            sin tarjetas.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={onShopNow}
              className="group flex items-center gap-3 bg-volt px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-ink transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(115,60,169,0.5)]"
            >
              Comprar ahora
              <IconArrow className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </button>
            <button
              onClick={onCaps}
              className="border border-seam px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-bone transition-colors hover:border-grape hover:text-volt"
            >
              Ver gorras
            </button>
          </div>

          {/* ledger de confianza */}
          <dl className="mt-12 grid grid-cols-3 divide-x divide-seam border-y border-seam">
            {[
              ["48H", "Despacho"],
              ["$120+", "Envío gratis"],
              ["CONTRA", "entrega"],
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

        {/* -------- derecha: la mascota -------- */}
        <div className="relative lg:col-span-5">
          <div className="animate-float relative mx-auto max-w-sm lg:mt-2">
            <div className="group relative rotate-2 border border-seam bg-coal p-3 transition-transform duration-500 hover:rotate-0">
              <div className="absolute -top-3 left-6 z-10 bg-grape px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-bone">
                El guardián del drop
              </div>
              <div className="overflow-hidden">
                <img
                  src={STORE.mascot}
                  alt="Fantasma púrpura, mascota de VLT/STRT, flotando bajo luces neón"
                  className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide">Drop 004 en vivo</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ash">Stock real · ediciones cortas</p>
                </div>
                <p className="font-display text-2xl text-volt">−10%</p>
              </div>
            </div>

            {/* sello giratorio */}
            <div className="absolute -left-10 -top-8 hidden h-28 w-28 sm:block lg:-left-14">
              <svg viewBox="0 0 100 100" className="h-full w-full animate-spin-slow">
                <defs>
                  <path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
                </defs>
                <circle cx="50" cy="50" r="49" className="fill-ink stroke-seam" strokeWidth="1" />
                <text className="fill-bone text-[9.5px] font-semibold uppercase" style={{ letterSpacing: "2.6px" }}>
                  <textPath href="#circ">envío gratis desde $120 · drop 004 ·</textPath>
                </text>
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                <IconBolt className="h-6 w-6 text-volt" />
              </span>
            </div>

            {/* sticker de precio */}
            <div className="absolute -bottom-5 -left-4 -rotate-6 border border-seam bg-ink px-4 py-2 sm:-left-10">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ash">Gorras desde</p>
              <p className="font-display text-3xl leading-none text-volt">$38</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
