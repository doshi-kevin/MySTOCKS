"use client";
import { motion } from "motion/react";
import type { Position, Quotes } from "@/lib/types";
import { formatINR, formatPct, formatSignedINR } from "@/lib/format";
import clsx from "clsx";

export function PortfolioSummary({
  positions,
  quotes,
}: {
  positions: Position[];
  quotes: Quotes;
}) {
  let invested = 0;
  let currentValue = 0;
  let dayChange = 0;

  for (const p of positions) {
    const q = quotes[p.symbol];
    invested += p.buyPrice * p.quantity;
    const cur = q?.price ?? p.buyPrice;
    currentValue += cur * p.quantity;
    if (q) dayChange += q.dayChange * p.quantity;
  }

  const unrealized = currentValue - invested;
  const unrealizedPct = invested > 0 ? (unrealized / invested) * 100 : 0;
  const dayPct =
    currentValue - dayChange > 0 ? (dayChange / (currentValue - dayChange)) * 100 : 0;

  const gain = unrealized >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-line bg-white/[0.03] p-8 backdrop-blur-xl"
    >
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl"
        style={{
          background: gain
            ? "radial-gradient(circle, rgba(52,211,153,0.4), transparent 70%)"
            : "radial-gradient(circle, rgba(248,113,113,0.4), transparent 70%)",
        }}
      />
      <div className="relative grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-[10px] uppercase tracking-[0.25em] text-mute">
            Portfolio value
          </div>
          <div className="mt-2 font-mono text-5xl tabular tracking-tight md:text-6xl">
            {formatINR(currentValue)}
          </div>
          <div
            className={clsx(
              "mt-2 font-mono text-sm tabular",
              gain ? "text-gain" : "text-loss",
            )}
          >
            {gain ? "▲" : "▼"} {formatSignedINR(unrealized)}{" "}
            <span className="text-mute">·</span> {formatPct(unrealizedPct)} all time
          </div>
        </div>

        <Stat
          label="Invested"
          value={formatINR(invested)}
          tint="text-chalk"
        />
        <Stat
          label="Today"
          value={formatSignedINR(dayChange)}
          sub={`${dayPct >= 0 ? "+" : ""}${formatPct(dayPct)}`}
          tint={dayChange >= 0 ? "text-gain" : "text-loss"}
        />
      </div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  sub,
  tint,
}: {
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-mute">
        {label}
      </div>
      <div className={clsx("mt-2 font-mono text-2xl tabular", tint)}>
        {value}
      </div>
      {sub && (
        <div className={clsx("mt-1 font-mono text-xs tabular", tint, "opacity-70")}>
          {sub}
        </div>
      )}
    </div>
  );
}
