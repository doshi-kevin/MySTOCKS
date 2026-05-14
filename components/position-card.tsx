"use client";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Position, Quote } from "@/lib/types";
import { formatINR, formatPct, daysHeld } from "@/lib/format";

export function PositionCard({
  position,
  quote,
  onEdit,
  onDelete,
  onResetAlert,
}: {
  position: Position;
  quote?: Quote;
  onEdit: () => void;
  onDelete: () => void;
  onResetAlert: (kind: "target" | "stoploss") => void;
}) {
  const current = quote?.price ?? position.buyPrice;
  const pnl = (current - position.buyPrice) * position.quantity;
  const pnlPct = ((current - position.buyPrice) / position.buyPrice) * 100;
  const dayPct = quote?.dayChangePct ?? 0;
  const targetHit = quote && current >= position.targetPrice;
  const stoplossHit = quote && current <= position.stoploss;

  // progress on buy → target axis
  const progress = Math.max(
    0,
    Math.min(
      1,
      (current - position.buyPrice) / (position.targetPrice - position.buyPrice || 1),
    ),
  );
  const dots = 5;
  const filled = Math.round(progress * dots);

  const [flash, setFlash] = useState<"" | "up" | "down">("");
  const [lastPrice, setLastPrice] = useState(current);
  useEffect(() => {
    if (!quote) return;
    if (quote.price !== lastPrice) {
      setFlash(quote.price > lastPrice ? "up" : "down");
      const t = setTimeout(() => setFlash(""), 600);
      setLastPrice(quote.price);
      return () => clearTimeout(t);
    }
  }, [quote, lastPrice]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      className={clsx(
        "group relative overflow-hidden rounded-2xl border bg-white/[0.04] p-6 backdrop-blur-xl transition-shadow",
        targetHit && !position.alertedTarget && "animate-pulse-gain",
        stoplossHit && !position.alertedStoploss && "animate-pulse-loss",
        targetHit
          ? "border-gain/60 shadow-[0_0_40px_-12px_rgba(52,211,153,0.6)]"
          : stoplossHit
            ? "border-loss/60 shadow-[0_0_40px_-12px_rgba(248,113,113,0.6)]"
            : "border-line",
      )}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-medium text-chalk">
            {position.name}
          </div>
          <div className="font-mono text-xs text-mute">
            {position.symbol} · held {daysHeld(position.buyDate)}d
          </div>
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <IconBtn onClick={onEdit} label="Edit">
            ✎
          </IconBtn>
          <IconBtn onClick={onDelete} label="Delete">
            ✕
          </IconBtn>
        </div>
      </div>

      {/* price */}
      <div className="mt-5 flex items-baseline gap-3">
        <div
          className={clsx(
            "font-mono text-4xl tabular tracking-tight transition-colors duration-500",
            flash === "up" && "text-gain",
            flash === "down" && "text-loss",
          )}
        >
          {quote ? `₹${quote.price.toFixed(2)}` : <span className="text-mute">—</span>}
        </div>
        <div
          className={clsx(
            "font-mono text-sm tabular",
            dayPct >= 0 ? "text-gain" : "text-loss",
          )}
        >
          {dayPct >= 0 ? "▲" : "▼"} {formatPct(Math.abs(dayPct))}
        </div>
      </div>

      {/* alert badges */}
      {targetHit && (
        <Badge
          tone="gain"
          onReset={
            position.alertedTarget
              ? () => onResetAlert("target")
              : undefined
          }
        >
          🎯 Target hit — consider selling
        </Badge>
      )}
      {stoplossHit && (
        <Badge
          tone="loss"
          onReset={
            position.alertedStoploss
              ? () => onResetAlert("stoploss")
              : undefined
          }
        >
          ⚠ Stoploss hit — review exit
        </Badge>
      )}

      {/* details */}
      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <Row label="Buy" value={formatINR(position.buyPrice)} />
        <Row label="Qty" value={position.quantity.toString()} />
        <Row
          label="Target"
          value={formatINR(position.targetPrice)}
          tone="gain"
        />
        <Row
          label="Stoploss"
          value={formatINR(position.stoploss)}
          tone="loss"
        />
      </div>

      {/* progress to target */}
      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-mute">
          <span>Progress to target</span>
          <span className="font-mono tabular">{Math.round(progress * 100)}%</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < filled ? "bg-gain" : "bg-white/10",
              )}
            />
          ))}
        </div>
      </div>

      {/* footer P&L */}
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
        <div className="text-mute">Unrealized</div>
        <div
          className={clsx(
            "font-mono tabular",
            pnl >= 0 ? "text-gain" : "text-loss",
          )}
        >
          {pnl >= 0 ? "+" : ""}
          {formatINR(pnl)} · {formatPct(pnlPct)}
        </div>
      </div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-mute">
        {label}
      </span>
      <span
        className={clsx(
          "font-mono tabular text-sm",
          tone === "gain" ? "text-gain" : tone === "loss" ? "text-loss" : "text-chalk",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Badge({
  tone,
  children,
  onReset,
}: {
  tone: "gain" | "loss";
  children: React.ReactNode;
  onReset?: () => void;
}) {
  return (
    <div
      className={clsx(
        "mt-3 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-medium",
        tone === "gain"
          ? "bg-gain/10 text-gain"
          : "bg-loss/10 text-loss",
      )}
    >
      <span>{children}</span>
      {onReset && (
        <button
          onClick={onReset}
          className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-chalk/80 transition-colors hover:bg-white/5"
        >
          Reset
        </button>
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-sm text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
    >
      {children}
    </button>
  );
}
