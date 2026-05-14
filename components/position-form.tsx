"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Position } from "@/lib/types";

type FormData = {
  symbol: string;
  market: ".NS" | ".BO";
  name: string;
  buyPrice: string;
  targetPrice: string;
  stoploss: string;
  buyDate: string;
  quantity: string;
  notes: string;
};

const empty: FormData = {
  symbol: "",
  market: ".NS",
  name: "",
  buyPrice: "",
  targetPrice: "",
  stoploss: "",
  buyDate: new Date().toISOString().slice(0, 10),
  quantity: "",
  notes: "",
};

function splitSymbol(full: string): { base: string; suffix: ".NS" | ".BO" } {
  if (full.endsWith(".BO")) return { base: full.slice(0, -3), suffix: ".BO" };
  if (full.endsWith(".NS")) return { base: full.slice(0, -3), suffix: ".NS" };
  return { base: full, suffix: ".NS" };
}

export function PositionForm({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Position;
  onClose: () => void;
  onSubmit: (data: Omit<Position, "id" | "createdAt" | "updatedAt"> & { id?: string }) => void;
}) {
  const [data, setData] = useState<FormData>(empty);
  const [warn, setWarn] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (initial) {
      const { base, suffix } = splitSymbol(initial.symbol);
      setData({
        symbol: base,
        market: suffix,
        name: initial.name,
        buyPrice: String(initial.buyPrice),
        targetPrice: String(initial.targetPrice),
        stoploss: String(initial.stoploss),
        buyDate: initial.buyDate,
        quantity: String(initial.quantity),
        notes: initial.notes ?? "",
      });
    } else {
      setData(empty);
    }
    setWarn(null);
  }, [initial, open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const buy = parseFloat(data.buyPrice);
    const tgt = parseFloat(data.targetPrice);
    const sl = parseFloat(data.stoploss);
    const qty = parseFloat(data.quantity);
    if (!data.symbol.trim()) return;
    if (!Number.isFinite(buy) || !Number.isFinite(tgt) || !Number.isFinite(sl)) return;
    if (!Number.isFinite(qty) || qty <= 0) return;

    if (tgt <= buy || sl >= buy) {
      if (!warn) {
        setWarn(
          tgt <= buy
            ? "Target should be above buy price. Submit again to confirm."
            : "Stoploss should be below buy price. Submit again to confirm.",
        );
        return;
      }
    }

    onSubmit({
      id: initial?.id,
      symbol: `${data.symbol.trim().toUpperCase()}${data.market}`,
      name: data.name.trim() || data.symbol.toUpperCase(),
      buyPrice: buy,
      targetPrice: tgt,
      stoploss: sl,
      buyDate: data.buyDate,
      quantity: qty,
      notes: data.notes.trim() || undefined,
      alertedTarget: initial?.alertedTarget,
      alertedStoploss: initial?.alertedStoploss,
    });
  };

  const lookupName = async () => {
    if (!data.symbol.trim()) return;
    setLookingUp(true);
    try {
      const fullSymbol = `${data.symbol.trim().toUpperCase()}${data.market}`;
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(fullSymbol)}`);
      if (res.ok) {
        const json = await res.json();
        const q = json[fullSymbol];
        if (q?.shortName && !data.name) {
          setData((d) => ({ ...d, name: q.shortName }));
        }
        if (q?.price && !data.buyPrice) {
          setData((d) => ({ ...d, buyPrice: q.price.toFixed(2) }));
        }
      }
    } catch {
      /* ignore */
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-line bg-ink-950/95 backdrop-blur-2xl"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <div>
                <h2 className="text-xl font-medium">
                  {initial ? "Edit position" : "Add position"}
                </h2>
                <p className="text-xs text-mute">
                  Indian markets · NSE / BSE
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-sm text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
              >
                Close
              </button>
            </header>

            <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div className="grid grid-cols-[1fr_88px] gap-2">
                  <Field
                    label="Symbol"
                    placeholder="RELIANCE"
                    value={data.symbol}
                    onChange={(v) =>
                      setData((d) => ({ ...d, symbol: v.toUpperCase() }))
                    }
                    onBlur={lookupName}
                    autoFocus
                  />
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-mute">
                      Market
                    </label>
                    <select
                      value={data.market}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          market: e.target.value as ".NS" | ".BO",
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-chalk focus:border-white/30 focus:outline-none"
                    >
                      <option value=".NS">NSE</option>
                      <option value=".BO">BSE</option>
                    </select>
                  </div>
                </div>

                <Field
                  label={
                    <span className="flex items-center gap-2">
                      Name {lookingUp && <span className="text-mute">(looking up…)</span>}
                    </span>
                  }
                  placeholder="Reliance Industries"
                  value={data.name}
                  onChange={(v) => setData((d) => ({ ...d, name: v }))}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Buy price (₹)"
                    type="number"
                    step="0.01"
                    placeholder="2820.00"
                    value={data.buyPrice}
                    onChange={(v) => setData((d) => ({ ...d, buyPrice: v }))}
                  />
                  <Field
                    label="Quantity"
                    type="number"
                    step="1"
                    placeholder="45"
                    value={data.quantity}
                    onChange={(v) => setData((d) => ({ ...d, quantity: v }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Target (₹)"
                    type="number"
                    step="0.01"
                    placeholder="3100.00"
                    value={data.targetPrice}
                    onChange={(v) =>
                      setData((d) => ({ ...d, targetPrice: v }))
                    }
                  />
                  <Field
                    label="Stoploss (₹)"
                    type="number"
                    step="0.01"
                    placeholder="2700.00"
                    value={data.stoploss}
                    onChange={(v) => setData((d) => ({ ...d, stoploss: v }))}
                  />
                </div>

                <Field
                  label="Buy date"
                  type="date"
                  value={data.buyDate}
                  onChange={(v) => setData((d) => ({ ...d, buyDate: v }))}
                />

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-mute">
                    Notes (optional)
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={(e) =>
                      setData((d) => ({ ...d, notes: e.target.value }))
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-chalk placeholder:text-mute/40 focus:border-white/30 focus:outline-none"
                    placeholder="Thesis, catalysts, anything to remember"
                  />
                </div>

                {warn && (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                    {warn}
                  </div>
                )}
              </div>
            </form>

            <footer className="flex items-center gap-3 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-line bg-white/[0.03] py-2.5 text-sm text-mute transition-colors hover:text-chalk"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                type="submit"
                className="flex-1 rounded-lg bg-chalk py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.02]"
              >
                {initial ? "Save changes" : "Add position"}
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  step,
  autoFocus,
}: {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  step?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-mute">
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="mt-1.5 w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-chalk placeholder:text-mute/40 focus:border-white/30 focus:outline-none"
      />
    </label>
  );
}
