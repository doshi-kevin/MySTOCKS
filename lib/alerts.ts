import type { Position, Quotes } from "./types";

export type AlertEvent = {
  positionId: string;
  symbol: string;
  name: string;
  kind: "target" | "stoploss";
  price: number;
  threshold: number;
};

export function evaluateAlerts(
  positions: Position[],
  quotes: Quotes,
): AlertEvent[] {
  const events: AlertEvent[] = [];
  for (const p of positions) {
    const q = quotes[p.symbol];
    if (!q) continue;
    if (!p.alertedTarget && q.price >= p.targetPrice) {
      events.push({
        positionId: p.id,
        symbol: p.symbol,
        name: p.name,
        kind: "target",
        price: q.price,
        threshold: p.targetPrice,
      });
    }
    if (!p.alertedStoploss && q.price <= p.stoploss) {
      events.push({
        positionId: p.id,
        symbol: p.symbol,
        name: p.name,
        kind: "stoploss",
        price: q.price,
        threshold: p.stoploss,
      });
    }
  }
  return events;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

export function fireNotification(event: AlertEvent): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const title =
    event.kind === "target"
      ? `🎯 Target hit — ${event.name}`
      : `⚠ Stoploss hit — ${event.name}`;
  const body =
    event.kind === "target"
      ? `${event.symbol} reached ₹${event.price.toFixed(2)} (target ₹${event.threshold.toFixed(2)}). Consider selling.`
      : `${event.symbol} dropped to ₹${event.price.toFixed(2)} (stoploss ₹${event.threshold.toFixed(2)}). Consider exiting.`;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: `${event.positionId}:${event.kind}`,
    });
  } catch {
    /* swallow — notifications best-effort */
  }
}
