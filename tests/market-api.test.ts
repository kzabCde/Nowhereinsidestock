import assert from "node:assert/strict";
import test from "node:test";
import { createQuoteHandler, createSearchHandler } from "../lib/services/market-api.ts";
import { createMarketCache, createMarketTransport } from "../lib/services/market-cache.ts";
import { MarketDataError } from "../lib/services/market-errors.ts";
import { loadQuoteParts } from "../lib/services/quote-parts.ts";
import { buildDailySeries } from "../lib/indicators/daily-series.ts";
import type { QuoteSnapshot } from "../lib/types/market.ts";

const retrievedAt = "2025-01-10T15:01:00Z";
const snapshot: QuoteSnapshot = {
  symbol: "AAPL", currency: "USD", latestPrice: 123, changePercent: null,
  marketTime: "2025-01-10T15:00:00Z", lastUpdated: retrievedAt,
  freshness: { source: "quote", retrievedAt, ageSeconds: 0, stale: false }
};

test("quote routes validate parameters, use the summary fast path, and preserve provider errors", async () => {
  const calls: unknown[] = [];
  const handler = createQuoteHandler(async (symbol, range, fundamentals) => {
    calls.push([symbol, range, fundamentals]);
    throw new MarketDataError("rate_limited");
  }, async (symbol) => {
    calls.push(symbol);
    return snapshot;
  });
  const get = (symbol: string, path = "") =>
    handler(new Request(`https://unit.test/api/quote/${encodeURIComponent(symbol)}${path}`), { params: Promise.resolve({ symbol }) });
  assert.equal((await get("../bad")).status, 400);
  assert.equal((await get("AAPL", "?range=constructor")).status, 400);
  const detail = await get(" aapl ", "?view=technical&range=1M");
  assert.equal(detail.status, 429);
  assert.equal((await detail.json()).code, "rate_limited");
  const summary = await get("aapl", "?view=summary");
  assert.deepEqual(await summary.json(), snapshot);
  assert.deepEqual(calls, [["AAPL", "1M", false], "AAPL"]);
});

test("optional provider failure preserves a valid quote at the API boundary", async () => {
  const handler = createQuoteHandler(async () => {
    const parts = await loadQuoteParts(Promise.resolve(snapshot), Promise.resolve([]), Promise.reject(Error("Profile down")));
    return {
      ...parts.quote!, ...buildDailySeries(parts.history ?? [], "6M", "2025-01-10", 123),
      unavailable: parts.profile ? [] : ["fundamentals"], historyStale: false,
      insight: { trend: "neutral", momentum: "weak", momentumScore: 0, rsiSignal: "neutral", macdSignal: "neutral", volatility: 0 },
      supportResistance: { supports: [], resistances: [] }, valuationMetrics: {}
    };
  }, async () => snapshot);
  const response = await handler(new Request("https://unit.test/api/stocks/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.latestPrice, 123);
  assert.equal(body.marketTime, snapshot.marketTime);
  assert.equal(body.lastUpdated, retrievedAt);
  assert.deepEqual(body.unavailable, ["fundamentals"]);
});

test("search distinguishes empty results from provider errors", async () => {
  const search = createSearchHandler(async (query) => {
    if (query === "FAIL") throw new MarketDataError("timeout");
    return { results: [], stale: false };
  });
  const response = await search(new Request("https://unit.test/api/search?q=NONE"));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).results, []);
  const error = await search(new Request("https://unit.test/api/search?q=FAIL"));
  assert.equal(error.status, 504);
  assert.equal((await error.json()).code, "timeout");
});

test("transport bounds concurrent provider work, aborts timeouts and respects rate limits", async () => {
  const transport = createMarketTransport({ concurrency: 1, maxQueued: 1, timeoutMs: 30 });
  const timedOut = transport((signal) => new Promise((_, reject) => signal.addEventListener("abort", () => reject(signal.reason))));
  const notQueued = transport(async () => 3);
  const queueFull = transport(async () => 4);
  await assert.rejects(queueFull, { code: "rate_limited" });
  await assert.rejects(timedOut, { code: "timeout" });
  assert.equal(await notQueued, 3);
  await assert.rejects(transport(async () => { throw { code: 429 }; }), { code: "rate_limited" });
  await assert.rejects(transport(async () => assert.fail("Rate-limit cooldown should block provider work")), { code: "rate_limited" });
});

test("cache coalesces reads, preserves retrieval time on failure, and expires stale data", async () => {
  let now = Date.parse(retrievedAt);
  let loads = 0;
  const cached = createMarketCache<number>({ ttlMs: 1000, staleMs: 10_000 }, 2, () => now);
  const load = async () => ++loads;
  const [a, b] = await Promise.all([cached("symbol", load), cached("symbol", load)]);
  assert.equal(loads, 1);
  assert.deepEqual(a, b);
  now += 2500;
  const fail = async () => { throw new MarketDataError("provider_unavailable"); };
  const stale = await cached("symbol", fail);
  assert.equal(stale.stale, true);
  assert.equal(stale.retrievedAt, a.retrievedAt);
  assert.equal(stale.ageSeconds, 2);
  now += 10_000;
  await assert.rejects(cached("symbol", fail), { code: "provider_unavailable" });
});

test("chart view can use history without requesting a quote or fundamentals", async () => {
  const chart = buildDailySeries([], "3Y", "2025-01-10", 123);
  const handle = createQuoteHandler(
    async () => assert.fail("Chart view should not load detail"),
    async () => assert.fail("Chart view should not load a quote"),
    async (symbol, range) => {
      assert.equal(symbol, "AAPL");
      assert.equal(range, "3Y");
      return { symbol, candles: chart.candles, chart: chart.chart, indicators: chart.indicators, historyStale: false };
    }
  );
  const response = await handle(new Request("https://unit.test/api/stocks/AAPL?view=chart&range=3Y"), { params: Promise.resolve({ symbol: "AAPL" }) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.chart.interval, "1wk");
  assert.equal(body.latestPrice, undefined);
});
