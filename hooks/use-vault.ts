"use client";
import { useCallback, useEffect, useState } from "react";
import type { VaultEntry } from "@/lib/types";
import { loadVault, saveVault } from "@/lib/storage";

export function useVault() {
  const [vault, setVault] = useState<VaultEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setVault(loadVault());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveVault(vault);
  }, [vault, hydrated]);

  const upsert = useCallback(
    (entry: Omit<VaultEntry, "id" | "createdAt">) => {
      setVault((prev) => {
        const idx = prev.findIndex(
          (e) => e.gistId === entry.gistId && e.token === entry.token,
        );
        const now = new Date().toISOString();
        if (idx >= 0) {
          const next = prev.slice();
          next[idx] = { ...next[idx], ...entry, lastUsedAt: now };
          return next;
        }
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        return [
          { ...entry, id, createdAt: now, lastUsedAt: now },
          ...prev,
        ];
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setVault((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { vault, hydrated, upsert, remove };
}
