import { useMemo, useState } from "react";
import type { SqlValue } from "sql.js";
import {
  getDBStats,
  getQueryLog,
  resetDB,
  runConsoleSQL,
  useDB,
} from "../lib/db";
import { IconBolt, IconClose } from "./icons";

/* SQL console slide-over — live proof that a real database is running */
export default function DBConsole({ open, onClose }: { open: boolean; onClose: () => void }) {
  useDB();
  const [sql, setSql] = useState("SELECT * FROM orders;");
  const [result, setResult] = useState<
    | { kind: "rows"; columns: string[]; rows: SqlValue[][] }
    | { kind: "exec"; changes: string }
    | { kind: "error"; message: string }
    | null
  >(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const dbVersion = useDB();
  const stats = useMemo(() => getDBStats(), [open, dbVersion]);
  const log = getQueryLog();

  const run = () => {
    try {
      setResult(runConsoleSQL(sql));
    } catch (e) {
      setResult({ kind: "error", message: (e as Error).message });
    }
  };

  return (
    <>
      <button
        aria-label="Close console"
        onClick={onClose}
        className={`fixed inset-0 z-[64] bg-ink/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-hidden={!open}
        className={`fixed inset-y-0 left-0 z-[65] flex w-full max-w-md flex-col border-r border-seam bg-coal transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-seam px-5 py-4">
          <h2 className="flex items-center gap-3 font-display text-2xl">
            SQL CONSOLE
            <span className="flex items-center gap-1.5 bg-panel px-2 py-1 font-mono text-[10px] font-normal text-volt">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-volt" /> LIVE
            </span>
          </h2>
          <button
            onClick={onClose}
            aria-label="Close console"
            className="grid h-10 w-10 place-items-center border border-seam text-bone transition-colors hover:border-volt hover:text-volt"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* stats */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
              Database — {stats.sizeKB} KB on disk
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {stats.tables.map((t) => (
                <div key={t.name} className="flex items-center justify-between border border-seam bg-panel/50 px-3 py-2">
                  <span className="font-mono text-[12px] text-bone">{t.name}</span>
                  <span className="font-mono text-[12px] font-bold text-volt">{t.rows}</span>
                </div>
              ))}
            </div>
          </div>

          {/* editor */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">Run a statement</p>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              rows={3}
              spellCheck={false}
              className="mt-2.5 w-full resize-none border border-seam bg-ink px-4 py-3 font-mono text-[13px] text-volt outline-none transition-colors focus:border-volt"
            />
            <button
              onClick={run}
              className="mt-2 flex w-full items-center justify-center gap-2 bg-volt py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-ink transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <IconBolt className="w-3.5 h-3.5" /> Execute
            </button>

            {result?.kind === "rows" && (
              <div className="mt-3 overflow-x-auto border border-seam">
                <table className="w-full font-mono text-[11px]">
                  <thead>
                    <tr className="bg-panel text-left text-volt">
                      {result.columns.map((c) => (
                        <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-bold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-seam/60">
                    {result.rows.map((r, i) => (
                      <tr key={i}>
                        {r.map((v, j) => (
                          <td key={j} className="max-w-[160px] truncate whitespace-nowrap px-2.5 py-1.5 text-bone/80">
                            {v === null ? <span className="text-ash">NULL</span> : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="border-t border-seam px-2.5 py-1.5 text-[10px] text-ash">
                  {result.rows.length} row(s) returned
                </p>
              </div>
            )}
            {result?.kind === "exec" && (
              <p className="mt-3 border border-volt/40 bg-volt/10 px-3 py-2.5 font-mono text-[12px] text-volt">
                ✓ {result.changes}
              </p>
            )}
            {result?.kind === "error" && (
              <p className="mt-3 border border-ember/50 bg-ember/10 px-3 py-2.5 font-mono text-[12px] text-ember">
                ✗ {result.message}
              </p>
            )}
          </div>

          {/* query log */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ash">
              Query log — last {log.length}
            </p>
            <div className="mt-2.5 max-h-64 space-y-1 overflow-y-auto border border-seam bg-ink p-3 font-mono text-[11px]">
              {log.length === 0 && <p className="text-ash">No queries yet.</p>}
              {log.map((q, i) => (
                <p key={q.t + i} className="break-all leading-relaxed">
                  <span className="mr-1.5 text-grape">
                    {new Date(q.t).toLocaleTimeString(undefined, { hour12: false })}
                  </span>
                  <span className={/^(select|console> select)/i.test(q.sql) ? "text-bone/75" : "text-volt/80"}>
                    {q.sql}
                  </span>
                </p>
              ))}
            </div>
          </div>

          {/* danger zone */}
          <div className="border border-dashed border-seam p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ember">Danger zone</p>
            <p className="mt-1.5 text-[12px] text-ash">
              Wipe orders, cart, reviews and alerts — stock reseeds to drop 004 values.
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
                setResult(null);
              }}
              className={`mt-3 w-full border py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                confirmReset
                  ? "border-ember bg-ember text-ink"
                  : "border-seam text-ash hover:border-ember hover:text-ember"
              }`}
            >
              {confirmReset ? "Tap again to confirm wipe" : "Reset demo data"}
            </button>
          </div>

          <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ash">
            engine: SQLite (WASM) · file persisted in IndexedDB
          </p>
        </div>
      </aside>
    </>
  );
}

