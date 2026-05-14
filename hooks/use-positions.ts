"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Position, Settings } from "@/lib/types";
import {
  loadPositions,
  loadSettings,
  savePositions,
  saveSettings,
} from "@/lib/storage";
import { pushGist, readyForSync } from "@/lib/gist-sync";

const nowIso = () => new Date().toISOString();

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [settings, setSettings] = useState<Settings>({
    autoSync: true,
    notificationsEnabled: false,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPositions(loadPositions());
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  // persist on change
  useEffect(() => {
    if (!hydrated) return;
    savePositions(positions);
  }, [positions, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveSettings(settings);
  }, [settings, hydrated]);

  // debounced gist push
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (!settings.autoSync) return;
    const deps = readyForSync(settings);
    if (!deps) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await pushGist(deps.token, deps.gistId, positions);
        setSettings((s) => ({ ...s, lastPushedAt: nowIso() }));
      } catch (err) {
        console.warn("auto push failed", err);
      }
    }, 5000);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
    // settings excluded to avoid loop on lastPushedAt update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, hydrated, settings.autoSync, settings.githubToken, settings.gistId]);

  const addPosition = useCallback(
    (p: Omit<Position, "id" | "createdAt" | "updatedAt">) => {
      setPositions((prev) => [
        {
          ...p,
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const updatePosition = useCallback(
    (id: string, patch: Partial<Position>) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p,
        ),
      );
    },
    [],
  );

  const removePosition = useCallback((id: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const replaceAll = useCallback((next: Position[]) => {
    setPositions(next);
  }, []);

  return {
    positions,
    settings,
    setSettings,
    hydrated,
    addPosition,
    updatePosition,
    removePosition,
    replaceAll,
  };
}
