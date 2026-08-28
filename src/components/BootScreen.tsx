import { useEffect, useState } from "react";
import { IconBolt } from "./icons";

const STEPS = [
  "loading SQLite engine (WASM)…",
  "opening browser database (IndexedDB)…",
  "CREATE TABLE stock, cart, orders, reviews…",
  "seeding drop 004 inventory…",
  "reconciling cart against live stock…",
];

/* Boot gate — shown while the SQLite WASM database initializes */
export default function BootScreen({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setShown((s) => Math.min(s + 1, STEPS.length)), 340);
    return () => clearInterval(t);
  }, [error]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 animate-pulse place-items-center bg-volt text-ink">
            <IconBolt className="w-6 h-6" />
          </span>
          <p className="font-display text-3xl tracking-wide">
            VLT<span className="text-volt">/</span>STRT
          </p>
        </div>

        <div className="mt-8 border border-seam bg-coal p-5 font-mono text-[13px]">
          {error ? (
            <>
              <p className="text-ember">✗ {error}</p>
              <p className="mt-2 text-ash">
                The local database engine failed to start. Your browser may block
                WebAssembly or IndexedDB in this context.
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-5 bg-volt px-5 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-transform hover:-translate-y-0.5"
                >
                  Retry boot
                </button>
              )}
            </>
          ) : (
            <>
              {STEPS.slice(0, shown).map((s, i) => (
                <p key={s} className="animate-rise text-ash">
                  <span className="mr-2 text-volt">▸</span>
                  {s}
                  {i < shown - 1 && <span className="ml-2 text-volt">ok</span>}
                </p>
              ))}
              <p className="mt-2 flex items-center gap-1 text-bone">
                <span className="mr-2 text-volt">▸</span>
                <span className="inline-block h-4 w-2 animate-blink bg-volt" />
              </p>
              {/* progress bar */}
              <div className="mt-5 h-1 w-full bg-panel">
                <div
                  className="h-full bg-volt transition-all duration-300"
                  style={{ width: `${(shown / STEPS.length) * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.24em] text-ash">
          SQLite · WebAssembly · persisted in IndexedDB
        </p>
      </div>
    </div>
  );
}
