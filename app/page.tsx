"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { usePositions } from "@/hooks/use-positions";
import { usePrices } from "@/hooks/use-prices";
import { TickerTape } from "@/components/ticker-tape";
import { PortfolioSummary } from "@/components/portfolio-summary";
import { PositionCard } from "@/components/position-card";
import { PositionForm } from "@/components/position-form";
import { SyncPanel } from "@/components/sync-panel";
import {
  evaluateAlerts,
  fireNotification,
  requestNotificationPermission,
} from "@/lib/alerts";
import type { Position } from "@/lib/types";

export default function Page() {
  const {
    positions,
    settings,
    setSettings,
    hydrated,
    addPosition,
    updatePosition,
    removePosition,
    replaceAll,
  } = usePositions();

  const symbols = useMemo(
    () => Array.from(new Set(positions.map((p) => p.symbol))),
    [positions],
  );
  const { quotes, error, lastUpdated } = usePrices(symbols);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | undefined>(undefined);
  const [syncOpen, setSyncOpen] = useState(false);

  // alerts
  useEffect(() => {
    if (!hydrated) return;
    const events = evaluateAlerts(positions, quotes);
    if (events.length === 0) return;
    for (const ev of events) {
      if (settings.notificationsEnabled) fireNotification(ev);
      updatePosition(ev.positionId, {
        [ev.kind === "target" ? "alertedTarget" : "alertedStoploss"]: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, hydrated]);

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setSettings((s) => ({ ...s, notificationsEnabled: perm === "granted" }));
  };

  const openAdd = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (p: Position) => {
    setEditing(p);
    setFormOpen(true);
  };
  const handleSubmit = (data: Omit<Position, "id" | "createdAt" | "updatedAt"> & { id?: string }) => {
    if (data.id) {
      const { id, ...patch } = data;
      updatePosition(id, patch);
    } else {
      const { id: _id, ...rest } = data;
      addPosition(rest);
    }
    setFormOpen(false);
  };

  const resetAlert = (id: string, kind: "target" | "stoploss") => {
    updatePosition(id, {
      [kind === "target" ? "alertedTarget" : "alertedStoploss"]: false,
    });
  };

  const live = !error && symbols.length > 0;

  return (
    <main className="min-h-screen pb-24">
      <TickerTape symbols={symbols} quotes={quotes} live={live} />

      <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10 flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-mute">
              MyStocks
            </div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
              Portfolio
            </h1>
            <div className="mt-1 text-xs text-mute">
              {lastUpdated
                ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}`
                : symbols.length === 0
                  ? "Add a position to begin"
                  : "Fetching prices…"}
              {error && <span className="ml-2 text-loss">· {error}</span>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!settings.notificationsEnabled && (
              <button
                onClick={enableNotifications}
                className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
              >
                🔔 Enable alerts
              </button>
            )}
            <button
              onClick={() => setSyncOpen(true)}
              className="rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-sm text-mute transition-colors hover:bg-white/[0.08] hover:text-chalk"
            >
              ⚙ Sync
            </button>
            <button
              onClick={openAdd}
              className="rounded-lg bg-chalk px-4 py-2 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03]"
            >
              + Add position
            </button>
          </div>
        </motion.div>

        {hydrated && positions.length > 0 && (
          <PortfolioSummary positions={positions} quotes={quotes} />
        )}

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {hydrated &&
            positions.map((p) => (
              <PositionCard
                key={p.id}
                position={p}
                quote={quotes[p.symbol]}
                onEdit={() => openEdit(p)}
                onDelete={() => {
                  if (confirm(`Delete ${p.name}?`)) removePosition(p.id);
                }}
                onResetAlert={(kind) => resetAlert(p.id, kind)}
              />
            ))}
        </div>

        {hydrated && positions.length === 0 && (
          <EmptyState onAdd={openAdd} />
        )}
      </div>

      <PositionForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <SyncPanel
        open={syncOpen}
        onClose={() => setSyncOpen(false)}
        settings={settings}
        setSettings={setSettings}
        positions={positions}
        replaceAll={replaceAll}
      />
    </main>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.2 }}
      className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-line bg-white/[0.02] px-6 py-20 text-center backdrop-blur-xl"
    >
      <div className="text-5xl">📈</div>
      <h2 className="mt-4 text-2xl font-medium">No positions yet</h2>
      <p className="mt-2 max-w-sm text-sm text-mute">
        Add your first holding with symbol, buy price, target, and stoploss. Live
        prices and alerts kick in automatically.
      </p>
      <button
        onClick={onAdd}
        className="mt-6 rounded-lg bg-chalk px-5 py-2.5 text-sm font-medium text-ink-950 transition-transform hover:scale-[1.03]"
      >
        + Add your first position
      </button>
    </motion.div>
  );
}
