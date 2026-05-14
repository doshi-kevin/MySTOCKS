# MyStocks — Personal Portfolio Tracker

**Date:** 2026-05-14
**Owner:** Kevin (personal use)
**Status:** Design approved, ready for implementation plan

---

## Purpose

A personal stock portfolio tracker for Indian (NSE/BSE) equities. The owner enters positions manually (symbol, buy price, target, stoploss, buy date, quantity); the dashboard fetches live prices and fires desktop notifications when a target or stoploss is hit so the owner does not miss exit windows.

Single-user, single-tenant. Deployed for the owner's own use only — no authentication, no other accounts.

---

## Success criteria

1. Owner can add, edit, and delete positions in under 15 seconds each.
2. Dashboard shows live prices (auto-refreshed) within 30 seconds of market movement.
3. When a position's live price crosses target or stoploss, a native desktop notification fires once per crossing.
4. Data persists locally and can be synced across browsers/devices via GitHub Gist with one button.
5. UI matches the agreed Glass / Aurora visual treatment (frosted glass cards, aurora gradient background, motion polish).

---

## Non-goals (explicitly out of scope)

- Multi-portfolio support — one portfolio per deployment.
- Historical performance charts beyond a 1-day sparkline.
- Tax or capital-gains computation.
- User authentication or multi-account.
- Sound chimes — desktop notifications only.
- Email alerts.
- Mobile-first layout — desktop primary, responsive down to tablet (~768 px) is the floor.
- Order placement, brokerage integration, or any real trading action.

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Matches project default; serverless API route needed for CORS proxy |
| Styling | Tailwind CSS | Project default |
| Motion | `motion/react` | Project default |
| Hosting | Vercel | Free tier covers traffic of one user; first-class Next.js support |
| Primary storage | Browser `localStorage` | No backend required |
| Sync (cross-device) | GitHub Gist via REST API | Free, no infra, owner controls data |
| Live prices | Yahoo Finance `query1.finance.yahoo.com/v7/finance/quote` via Next.js API route | Free, no key, supports `.NS`/`.BO` suffixes |
| Notifications | Web Notifications API | Native, no third-party service |
| Fonts | `Geist` + `Geist Mono` via `next/font` | Premium, modern, numerics line up |

---

## Data model

### Position
```ts
type Position = {
  id: string;              // crypto.randomUUID()
  symbol: string;          // "RELIANCE.NS" or "TCS.BO"
  name: string;            // friendly label, e.g. "Reliance Industries"
  buyPrice: number;        // ₹
  targetPrice: number;     // ₹
  stoploss: number;        // ₹
  buyDate: string;         // ISO date "YYYY-MM-DD"
  quantity: number;
  notes?: string;
  alertedTarget?: boolean;     // true once target alert has fired; reset by user action
  alertedStoploss?: boolean;   // true once stoploss alert has fired; reset by user action
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
};
```

### Settings
```ts
type Settings = {
  gistId?: string;             // set after first sync
  githubToken?: string;        // PAT with `gist` scope; localStorage only
  autoSync: boolean;           // default true once configured
  notificationsEnabled: boolean;
  lastPushedAt?: string;
  lastPulledAt?: string;
};
```

### localStorage keys
- `mystocks:positions` — JSON array of `Position`
- `mystocks:settings` — JSON `Settings`
- `mystocks:schema-version` — integer, currently `1`

---

## Architecture

### Client
- **Single-page dashboard** at `/`. No routing beyond the root page.
- **State**: positions and settings held in React state, hydrated from `localStorage` on mount; every mutation writes back synchronously.
- **Live prices**: a `usePrices(symbols)` hook polls `/api/quote` every 30 s while `document.visibilityState === 'visible'`. Pauses when hidden, and fetches immediately on the `visibilitychange` event when the tab becomes visible again (so returning to the tab does not wait up to 30 s for fresh prices).
- **Alerts**: after each price tick, a pure function `evaluateAlerts(positions, prices)` returns a list of `{ positionId, kind }` to fire. Each fires once, then sets `alertedTarget` / `alertedStoploss` on the position so it does not re-fire until reset.
- **Notification permission**: requested on the first click of the "Enable alerts" toggle. Never requested at page load.

### Server (one route)
- `GET /api/quote?symbols=RELIANCE.NS,TCS.NS` →
  - Fetches `https://query1.finance.yahoo.com/v7/finance/quote?symbols=...` server-side
  - Returns `{ [symbol]: { price: number, dayChangePct: number, currency: string } }`
  - Caches in-memory for 10 s to absorb rapid polling from multiple tabs
  - Returns HTTP 502 with `{ error }` if upstream fails; the client surfaces a small "live prices offline" banner but keeps the rest of the UI functional

### Sync (Gist)
- **First-time setup**: owner opens the Sync panel → pastes a GitHub PAT (scope: `gist`) → optionally pastes an existing Gist ID. If no ID is provided, a new private Gist is created on first push.
- **Push**: `PATCH /gists/:id` with the local positions + settings (minus `githubToken`) as a single file `mystocks-portfolio.json`.
- **Pull**: `GET /gists/:id`, replaces local state, updates `lastPulledAt`.
- **Auto-sync** (opt-in, default on once configured): debounced push 5 s after the last mutation; auto-pull on app load.
- **Initial pull is silent when local is empty** (no positions yet). Otherwise the auto-pull on load applies the same conflict check as manual pull and surfaces a confirmation banner if the remote is newer than `lastPulledAt` — never silently overwrites.
- **Conflict handling**: on pull, compare remote `updatedAt` (max across positions) vs local `lastPulledAt`. If remote is newer than `lastPulledAt`, show a banner: "Remote has changes since your last pull. Pull will overwrite local edits." Pull requires explicit confirmation in that case.

---

## UI / Visual treatment

**Style:** Glass / Aurora — modern fintech.

### Layout (top to bottom)
1. **Ticker tape** — full-width strip at the very top, scrolling marquee of all owned symbols with current price + day change. Pauses on hover.
2. **Portfolio summary card** — total current value, total invested, unrealized P&L (₹ + %), day change.
3. **Action row** — `+ Add Position`, `⬆ Push`, `⬇ Pull`, `⚙ Settings`.
4. **Position grid** — responsive grid of position cards. Three columns at ≥1280 px, two at ≥1024 px, one at <1024 px.

### Position card
- Stock name (friendly) + symbol (mono, muted)
- Current price (large, mono) + day change %
- Sparkline (1-day intraday, from Yahoo `chart` endpoint — see "Sparkline note" below)
- Rows: Buy, Target, Stoploss, Quantity, Bought (date)
- **Progress-to-target dots**: 5 dots showing how close current price is to target on the buy→target axis (`●●●○○`)
- Hover → faint glow + edit/delete icons fade in
- On target hit: card pulses green 3× then keeps a green border-glow until the owner clicks "Reset target alert"
- On stoploss hit: card pulses red 3× then keeps a red border-glow until the owner clicks "Reset stoploss alert"
- Reset buttons are per-threshold and per-card (a card that hit *both* target then stoploss shows two reset controls). Resetting clears the corresponding `alertedTarget` / `alertedStoploss` flag without re-firing until the price moves out of range and crosses back in.

### Add/Edit
- Right-side slide-in panel (not a modal). 420 px wide. Form fields:
  - Symbol (with `.NS` / `.BO` market dropdown that appends suffix)
  - Friendly name (auto-populated from Yahoo's `shortName` on blur of symbol)
  - Quantity, Buy price, Buy date, Target, Stoploss, Notes
- Inline validation: target > buy, stoploss < buy (warn but allow override).

### Visual tokens
| Token | Value |
|---|---|
| Background base | `#0A0A0F` |
| Aurora gradient | cyan `#22D3EE` → magenta `#D946EF` → amber `#F59E0B`, low opacity, `mix-blend-screen`, slowly drifting |
| Card | `bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl` |
| Text primary | `#F5F5F0` (warm white) |
| Text muted | `#9C9CA8` |
| Gain | `#34D399` |
| Loss | `#F87171` |
| Target hit | `#34D399` glow |
| Stoploss hit | `#F87171` glow |

### Motion
- First paint: cards fade + 24 px slide up, staggered 60 ms each, 0.7 s `easeOut`.
- Price changes: number tweens to new value over 400 ms; brief ghost color flash (green/red) on the price element.
- Hover micro-interactions: scale 1.01, glow brighten.
- All animations respect `prefers-reduced-motion`.

### Sparkline note
Yahoo's `query1.finance.yahoo.com/v8/finance/chart/:symbol?interval=5m&range=1d` returns intraday points. The `/api/quote` route is extended to optionally return these when `?withSpark=1` is passed, so we issue one combined request per polling tick.

---

## Components (file layout)

```
app/
  layout.tsx               # font setup, providers, aurora background mount
  page.tsx                 # dashboard composition
  globals.css              # Tailwind layers + aurora keyframes
  api/
    quote/route.ts         # Yahoo Finance proxy + sparkline data

components/
  aurora-background.tsx    # animated gradient, fixed, behind everything
  ticker-tape.tsx          # scrolling marquee
  portfolio-summary.tsx    # big totals card
  position-grid.tsx        # grid wrapper + empty state
  position-card.tsx        # single stock card
  position-form.tsx        # slide-in add/edit panel
  sync-panel.tsx           # PAT input + push/pull/auto-sync toggle
  alert-banner.tsx         # transient banners (live offline, sync conflict, etc.)

lib/
  storage.ts               # localStorage read/write + schema versioning
  gist-sync.ts             # GitHub Gist REST client
  yahoo.ts                 # quote + chart fetch helpers (server-only)
  alerts.ts                # permission + dispatch + evaluateAlerts()
  format.ts                # ₹ formatter, % formatter, date formatter
  types.ts                 # Position, Settings, Quote types

hooks/
  use-positions.ts         # CRUD + localStorage sync + debounced gist push
  use-prices.ts            # 30 s polling with visibility gate
  use-notifications.ts     # permission state + fire helper
```

Each file stays under ~120 lines. One responsibility per file.

---

## Error handling

| Scenario | Behavior |
|---|---|
| Yahoo Finance request fails | `/api/quote` returns 502; client shows "Live prices offline — retrying" banner; positions still render with last-known prices |
| Gist push fails (network / 401) | Inline error in Sync panel; local data untouched; "Retry" button |
| Gist pull conflict (remote newer than local) | Banner: "Remote has newer changes. Pull will overwrite local. [Pull anyway] [Cancel]" |
| Invalid PAT | 401 from GitHub → "Token rejected. Check scope is `gist` and try again." |
| User denies notification permission | Toggle stays off; in-app banner alerts still appear inside the app |
| `localStorage` corrupt JSON | Wrap reads in try/catch; on parse failure, snapshot the bad blob to `mystocks:positions.broken-<timestamp>` and start fresh; log a one-time banner so the owner sees what happened |
| Symbol not found by Yahoo | Form shows "Symbol not found on NSE/BSE — check the suffix" on blur |

---

## Testing

Manual verification (this is a one-user personal site; full test infra is overkill):

1. Add a position, reload the page → it persists.
2. Add 3 positions with mixed `.NS` / `.BO` suffixes → all show live prices within 30 s.
3. Set target = current price - 1 → notification fires within 30 s and card glows green.
4. Click "Reset alert" → card returns to normal; if price still above target, it does *not* immediately re-fire (alert stays reset until price dips below and re-crosses).
5. Configure Gist sync → push → open in a different browser → pull → positions match.
6. Disconnect internet → "Live prices offline" banner appears, app still usable.
7. Add a deliberately bad PAT → clean error, no data loss.
8. Open dev tools, corrupt `mystocks:positions` JSON, reload → app starts fresh, broken blob preserved under the `.broken-<timestamp>` key.

A lightweight smoke run via Playwright covering steps 1, 2, 5, and 8 is acceptable but not required for v1.

---

## Open questions

None at design time. All decisions are captured above.

---

## Future considerations (not in scope)

- Multi-portfolio (watchlist vs holdings vs sold)
- Realized P&L log when a position is "closed"
- Per-position alert history
- Optional encryption of the Gist payload (would let owner share the Gist publicly without leaking holdings)
- Mobile-first redesign
