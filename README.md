# NowhereInsideStock

NowhereInsideStock is a Thai and English stock research workspace by NOWHEREDEV. It uses Yahoo Finance for market data and keeps watchlists, research history, portfolio transactions, screener choices, and local alerts in the browser.

- Search Thai and U.S. tickers, explore candle, Heikin-Ashi, area, bar, and line charts, and inspect daily technical evidence.
- Compare two to four stocks by trading date and view pairwise correlation with sample sizes.
- Screen a Yahoo predefined U.S. universe, a curated universe, or up to 20 user-selected symbols.
- Track buys, sells, dividends, and fees in an average-cost portfolio ledger with JSON import and export.
- Monitor price, RSI, and moving-average crosses while the app is visible.
- Run historical simulations, compare valuation assumptions, and size hypothetical positions.

The application uses Next.js App Router, React, TypeScript, Tailwind CSS, Recharts, and Zustand. PostgreSQL is optional for the alert worker.

## Local development

Use Node.js 22 or newer. CI runs Node.js 22.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. When running behind an HTTP egress proxy, use a recent Node.js release that supports `NODE_USE_ENV_PROXY=1` and keep the environment’s proxy and TLS settings. In a restricted environment, Yahoo Finance requires HTTPS access to `query1.finance.yahoo.com`, `query2.finance.yahoo.com`, and `finance.yahoo.com`. The provider client may follow cookie-consent redirects to `guce.yahoo.com` and `consent.yahoo.com`.

### Environment variables

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata and sitemap. Defaults to the existing public URL. |
| `ALERT_BACKGROUND_ENABLED` | Optional server-only flag for the scheduled worker. Defaults to off. |
| `ALERT_DATABASE_URL` | Connection string for a dedicated alert database. Keep server-side and verify TLS for remote connections. |
| `CRON_SECRET` | Scheduler bearer credential. The worker requires at least 32 characters. Keep server-side. |
| `ALERT_DELIVERY` | Use `inbox` to write worker events to the internal, owner-scoped PostgreSQL inbox. Other values leave delivery disabled. |
| `NIS_ALERT_TEST_DATABASE_URL` | Integration-test database on loopback with a name ending in `_test`. |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | Optional installed Chromium binary for browser tests. Playwright’s managed Chromium is the default. |

## Market data and API

The API validates stock symbols and parameters server-side. Errors include a machine-readable `code` and human-readable `message` and `error`. Successful searches may return an empty list. Provider failures return an HTTP error.

| Route | Behavior |
| --- | --- |
| `/api/quote/[symbol]`, `/api/stocks/[symbol]` | Compatibility aliases. The default `view=detail` combines quote, history, and available fundamentals. `summary` requests a quote only. `technical` skips fundamentals. `chart` returns display candles and overlays. |
| `/api/search?q=…` | Ticker and company suggestions. |
| `/api/compare?symbols=…&range=…` | Daily price performance rebased on a shared interval. |
| `/api/rankings/[rankingType]` | Up to ten eligible candidates, with source, scope, timing, and counts. |
| `/api/screener?universe=…&symbols=…&technical=1&fundamental=1` | Bounded universe results. Enrichment is opt-in through request parameters. |
| `/api/internal/alert-worker` | Optional authenticated scheduler route. |

**Freshness.** Quote responses distinguish provider market time from retrieval time. Age is cache age when the response was assembled. Yahoo data can be delayed, and closed markets may return the prior session’s price. History-based fallbacks are labeled and omit the quote timestamp. Failed refreshes can keep the last successful snapshot with a stale indicator. Profile or fundamental outages can leave a valid quote usable.

**Caching.** Each running server process shares caches and coalesces concurrent reads for the same key. Typical TTLs are 30 seconds for quotes, five minutes for daily candles, one hour for fundamentals, two minutes for suggestions and provider screens, and one minute for batch quotes and assembled universes. Transient failures can reuse earlier snapshots for 15 minutes for quotes, suggestions, and candidate universes, or 24 hours for daily history and fundamentals. A bounded provider queue uses abortable request deadlines, one retry on temporary provider failures, and a cooldown on rate limits. These caches are process-local and can be lost when the runtime restarts.

**Charts and analytics.** Short charts display daily bars. Three- and five-year charts aggregate daily OHLCV by trading week. MA overlays are calculated from daily history with a warm-up window, and weekly points sample the last completed daily observation in the week. The stock’s analytics use a separate 400-calendar-day daily lookback independent of display range, ending on a completed session. MA200 needs 200 observations, and its cross with MA50 needs two defined observations. Missing indicators remain unavailable. Signal scoring describes technical direction and input coverage. Statistical confidence is unavailable.

**Comparisons and rankings.** Compare uses exchange-local trading dates and starts at 100 on the first shared observation. It ends on the last shared date and leaves gaps for missing observations. Returns are price-only and denominated in each listing’s currency. Correlation uses return intervals between consecutive dates shared by each pair. Market-specific holidays can reduce overlap, and the same date can have different closing times. Sortino measures downside deviation over all return intervals against a zero target by default. Ranking momentum is the signed MACD histogram as a percentage of closing price. Volatility rankings require 61 completed prices and annualize 60 daily log returns. Screener dividend yield is converted from the source’s fraction to percentage points. Monetary filters require a common currency. The provider screen is limited to 25 returned candidates.

## Portfolio accounting

The ledger applies moving weighted-average cost independently to each symbol and transaction currency. A buy adds quantity and includes its fees in acquisition cost. A sell releases cost basis in proportion to quantity and subtracts selling fees from proceeds. Liquidation resets the position’s basis. Dividends increase cash flow, standalone fees decrease it, and both affect total P&L. Transactions replay by date, with original ledger order breaking exact ties. A transaction that creates a negative holding on any date is rejected.

Unrealized P&L subtracts comparable cost from comparable market value. Positions missing a usable quote in their ledger currency are excluded from both sides. Realized P&L stays visible when current quotes are unavailable. Total P&L is shown per currency when all open positions in that currency can be priced. Allocation is based on priced positions within each currency. The app performs no FX conversions. This accounting is for personal tracking. Tax-lot calculations and broker reconciliation are outside the ledger.

Version 1 of the `nis-portfolio-v1` storage format migrates existing purchases into buy rows and preserves their original IDs. Import validates the whole candidate ledger before writing. Matching IDs with matching content are skipped. Conflicting IDs are rejected. Replace mode requires explicit browser confirmation.

## Backtest, valuation, and risk calculations

The backtest confirms moving-average crosses at the close and simulates execution at the next observed open. It uses fractional units, percentage fees and slippage per fill, and daily mark-to-market equity. The benchmark buys at the first open with the same entry cost assumptions and is marked at the last close. Open strategy positions remain open and count toward exposure. Win rate uses closed trades. Gaps are measured in calendar days and no candles are synthesized.

When samples are large enough, the first 70% and last 30% of observations are reported separately at fixed parameters. The holdout starts flat with the same capital and uses earlier observations only to warm up averages. The application does not fit parameters. Sensitivity varies the short SMA near the selected setting. Simulations omit dividends, taxes, borrowing, and execution constraints. Historical results do not predict returns.

P/E valuation multiplies EPS by an assumed multiple. The Graham number is the square root of 22.5 times EPS and book value per share. Dividend discounting divides the expected next annual dividend by the difference between required return and growth, expressed as decimals. Use the same currency for prices and per-share inputs. Provider retrieval timestamps describe when the inputs were retrieved. Verify fiscal dates separately. Scenario estimates show sensitivity to the selected assumptions.

The risk planner caps long positions by the stated cash balance. A separately labeled hypothetical short calculation uses the same balance as an illustrative notional cap. It does not model stock borrow, margin requirements, or financing. Gap risk, fees, taxes, and FX can cause different outcomes from a stop-price calculation.

## Alerts and optional background worker

Local alerts run while the workspace is visible, approximately every two minutes for price and every five for daily signals. A visibility change or manual check can request an evaluation sooner. The first observation establishes a baseline. Price and RSI must leave the condition before they can trigger again. Daily crosses use the completed trading date as their event key. Pausing stops checks, and resuming establishes a new baseline. In-app events and evaluation state persist on the device. Local alerts do not run after the browser closes.

The repository contains an optional PostgreSQL scheduler architecture. It stores owner-scoped definitions, evaluation history, event keys, and delivery state. Row locks and unique keys deduplicate evaluations and outbox records. Delivery uses expiring leases and up to five attempts with backoff. The internal inbox is idempotent. Email and Web Push have no active adapters.

To activate in a dedicated development or staging deployment:

1. Provision a separate PostgreSQL database and review `db/migrations/001_alert_worker.sql`. Run it against that database with a migration role.
2. Use a dedicated trusted worker role. The migration revokes public table access and enables row-level security. Configure grants and policies for that role to read and update definitions, insert checks, claim and update events, and insert inbox records. Keep that role out of browser code.
3. Establish the application’s user identity and ownership mapping before provisioning private definitions. `owner_id` must represent a verified owner. The worker is a trusted scheduler, and the app exposes no public CRUD or inbox endpoint. Any later API must derive owner identity from authenticated requests and enforce it on every row operation.
4. Set the server-only database URL, worker flag, and a dedicated cron secret. Configure a scheduler to send `GET /api/internal/alert-worker` with `Authorization: Bearer <CRON_SECRET>`. Use a cadence appropriate for the two- and five-minute evaluation intervals. The worker processes bounded batches.
5. Leave `ALERT_DELIVERY` unset unless an authorized workflow can consume the private inbox. Do not configure external delivery until recipient verification, consent, permissions, and an idempotent provider adapter are ready.

## Validation

```bash
npm ci
npm audit --audit-level=high
npm test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Browser tests start the production build and use fixtures for market responses. They exercise the real request validation routes separately. The PostgreSQL integration test requires an isolated local PostgreSQL database and creates a temporary schema:

```bash
NIS_ALERT_TEST_DATABASE_URL=postgres://postgres@127.0.0.1:55432/nis_alert_test npm run test:integration
```

Run live-provider checks separately from the deterministic suites. Check a known ticker in Search and Stock Detail and verify source timestamp, currency, and availability. A proxy denial, provider outage, or rate limit can make live data unavailable while the fixtures and financial tests continue to pass. PostgreSQL scheduling, authenticated definitions, and external notification delivery require separate activation.
