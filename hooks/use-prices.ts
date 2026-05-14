"use client";
import { useEffect, useRef, useState } from "react";
import type { Quotes } from "@/lib/types";

const POLL_MS = 30_000;

export function usePrices(symbols: string[]) {
  const [quotes, setQuotes] = useState<Quotes>({});
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const key = symbols.slice().sort().join(",");

  useEffect(() => {
    if (symbols.length === 0) {
      setQuotes({});
      return;
    }
    let cancelled = false;

    const fetchOnce = async () => {
      if (inFlight.current) inFlight.current.abort();
      const ac = new AbortController();
      inFlight.current = ac;
      try {
        const res = await fetch(
          `/api/quote?symbols=${encodeURIComponent(key)}`,
          { signal: ac.signal, cache: "no-store" },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = (await res.json()) as Quotes;
        if (!cancelled) {
          setQuotes(data);
          setError(null);
          setLastUpdated(Date.now());
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "fetch failed");
      }
    };

    fetchOnce();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") fetchOnce();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchOnce();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      if (inFlight.current) inFlight.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { quotes, error, lastUpdated };
}
