import { NextResponse } from "next/server";
import type { Quote, Quotes } from "@/lib/types";

type CacheEntry = { at: number; data: Quotes };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 10_000;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function fetchOne(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=5m&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return null;
  const meta = result.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice ?? 0;
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const dayChange = price - previousClose;
  const dayChangePct = previousClose ? (dayChange / previousClose) * 100 : 0;
  return {
    symbol: meta.symbol ?? symbol,
    price,
    dayChange,
    dayChangePct,
    dayHigh: meta.regularMarketDayHigh ?? price,
    dayLow: meta.regularMarketDayLow ?? price,
    previousClose,
    currency: meta.currency ?? "INR",
    shortName: meta.shortName ?? meta.longName ?? symbol,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json(
      { error: "missing 'symbols' query param" },
      { status: 400 },
    );
  }
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (symbols.length === 0) {
    return NextResponse.json({}, { status: 200 });
  }

  const cacheKey = symbols.slice().sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const results = await Promise.all(symbols.map(fetchOne));
    const out: Quotes = {};
    results.forEach((q, i) => {
      if (q) out[symbols[i]] = q;
    });
    cache.set(cacheKey, { at: Date.now(), data: out });
    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: `yahoo finance failed: ${message}` },
      { status: 502 },
    );
  }
}
