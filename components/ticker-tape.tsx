"use client";
import type { Quotes } from "@/lib/types";
import { formatPct } from "@/lib/format";
import clsx from "clsx";

export function TickerTape({
  symbols,
  quotes,
  live,
}: {
  symbols: string[];
  quotes: Quotes;
  live: boolean;
}) {
  if (symbols.length === 0) return null;

  const items = symbols.map((s) => {
    const q = quotes[s];
    return {
      symbol: s,
      price: q?.price,
      pct: q?.dayChangePct ?? 0,
    };
  });

  const row = (
    <div className="flex shrink-0 items-center gap-8 px-4">
      {items.map((it) => (
        <div key={it.symbol} className="flex items-center gap-2 text-sm">
          <span className="font-mono text-mute">{it.symbol}</span>
          <span className="font-mono tabular text-chalk">
            {it.price ? it.price.toFixed(2) : "—"}
          </span>
          <span
            className={clsx(
              "font-mono tabular text-xs",
              it.pct >= 0 ? "text-gain" : "text-loss",
            )}
          >
            {it.pct >= 0 ? "▲" : "▼"} {formatPct(Math.abs(it.pct))}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-b border-line bg-black/30 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-mute">
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              live ? "bg-gain animate-pulse" : "bg-mute",
            )}
          />
          {live ? "Live" : "Offline"}
        </span>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex w-max animate-marquee">
            {row}
            {row}
          </div>
        </div>
      </div>
    </div>
  );
}
