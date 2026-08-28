import { Fragment } from "react";
import { IconSpark } from "./icons";

/* Infinite marquee strip — content is rendered twice for a seamless loop */
export default function Ticker({
  items,
  reverse = false,
  accent = false,
}: {
  items: string[];
  reverse?: boolean;
  accent?: boolean;
}) {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === "b"}>
      {items.map((t, i) => (
        <Fragment key={i}>
          <span className="px-5 text-[11px] font-semibold tracking-[0.22em] whitespace-nowrap sm:px-7 sm:text-xs">
            {t}
          </span>
          <IconSpark className={`w-3 h-3 ${accent ? "text-ink" : "text-volt"}`} />
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`overflow-hidden border-y ${
        accent ? "bg-volt text-ink border-volt" : "bg-coal text-bone/80 border-seam"
      }`}
    >
      <div
        className={`flex w-max py-2.5 ${reverse ? "animate-marquee-rev" : "animate-marquee"}`}
      >
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
