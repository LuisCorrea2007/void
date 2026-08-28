import { STORE, CATEGORIES, type Category } from "../data/products";
import { IconArrow, IconBolt, IconWhatsApp } from "./icons";

/* Footer: giant wordmark, functional shop links, contact + payment chips */
export default function Footer({ onNav }: { onNav: (c: Category | "all") => void }) {
  return (
    <footer className="relative overflow-hidden pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        {/* giant wordmark */}
        <p
          aria-hidden
          className="text-outline pointer-events-none select-none whitespace-nowrap font-display text-[18vw] leading-[0.85] lg:text-[11rem]"
        >
          VLT/STRT
        </p>

        <div className="mt-10 grid gap-10 border-t border-seam pt-10 md:grid-cols-12">
          {/* brand */}
          <div className="md:col-span-5">
            <p className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center bg-volt text-ink">
                <IconBolt className="w-4 h-4" />
              </span>
              <span className="font-display text-lg">
                VLT<span className="text-volt">/</span>STRT
              </span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ash">
              Independent streetwear label. Heavyweight caps and clothing in limited runs —
              sold the old way: you message, we confirm, it ships.
            </p>
            {/* payment chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["Cash on Delivery", "Bank Transfer", "QRIS"].map((p) => (
                <span
                  key={p}
                  className="border border-seam px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ash"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* shop */}
          <div className="md:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">Shop</p>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onNav(c.id)}
                    className="group flex items-center gap-2 text-sm text-ash transition-colors hover:text-bone"
                  >
                    <span className="h-px w-0 bg-volt transition-all duration-300 group-hover:w-4" />
                    {c.label === "All gear" ? "Everything" : c.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* the manual way */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">How it works</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ash">
              <li>1. Pick your pieces</li>
              <li>2. Checkout → WhatsApp</li>
              <li>3. COD or transfer</li>
              <li>4. Ships in 48h</li>
            </ul>
          </div>

          {/* contact */}
          <div className="md:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-volt">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={`https://wa.me/${STORE.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-2 text-ash transition-colors hover:text-volt"
                >
                  <IconWhatsApp className="w-4 h-4" /> WhatsApp us
                </a>
              </li>
              {[
                ["Instagram", "https://instagram.com"],
                ["TikTok", "https://tiktok.com"],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-2 text-ash transition-colors hover:text-grape"
                  >
                    <IconArrow className="w-3.5 h-3.5 -rotate-45 transition-transform group-hover:translate-x-0.5" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* bottom bar */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-seam py-6 text-[11px] uppercase tracking-[0.18em] text-ash">
          <p>© 2026 VLT/STRT — Built loud, shipped fast.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2 transition-colors hover:text-volt"
          >
            Back to top
            <IconArrow className="w-3.5 h-3.5 -rotate-90 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
