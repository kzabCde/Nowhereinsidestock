import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_FILTERS, rankCandidates, screenCandidates, screenerDataNeeded } from "../lib/finance/screener.ts";
import type { RankingStock } from "../lib/types/market.ts";

function stock(symbol: string, fields: Partial<RankingStock>): RankingStock {
  return { symbol, name: symbol, rank: 0, currency: "USD", latestPrice: 100, changePercent: 2.5, volume: 2_000_000,
    marketCap: 10_000_000, trend: "uptrend", ...fields };
}

test("screener combines requested metrics and excludes candidates with unavailable data", () => {
  const sample = [
    stock("A", { rsi: 30, pe: 12, macdState: "buy", sector: "Technology", dividendYield: 3, ma200Position: "above" }),
    stock("B", { rsi: null, pe: 10, macdState: "buy", sector: "Technology", dividendYield: 3, ma200Position: "above" }),
    stock("C", { rsi: 20, pe: 22, macdState: "buy", sector: "Technology", dividendYield: 3, ma200Position: "above" }),
    stock("D", { rsi: 28, pe: 12, macdState: "buy", sector: "Utilities", dividendYield: 6, ma200Position: "above" })
  ];
  const filters = { ...EMPTY_FILTERS, minPrice: "90", maxPrice: "100", minChange: "2", maxChange: "3", minVolume: "1000000",
    minMarketCap: "10000000", maxRsi: "30", maxPe: "15", minYield: "3", sector: "tech", macdState: "buy", ma200Position: "above" };
  const result = screenCandidates(sample, filters, "change");
  assert.deepEqual(result.stocks.map(({ symbol }) => symbol), ["A"]);
  assert.equal(result.missing, 1);
  assert.deepEqual(screenerDataNeeded(filters, "change"), { technical: true, fundamental: true });
  assert.deepEqual(screenerDataNeeded(EMPTY_FILTERS, "provider"), { technical: false, fundamental: false });
});

test("screener validates range and requires a currency for mixed monetary comparisons", () => {
  const rows = [stock("A", {}), stock("B.BK", { currency: "THB" }), stock("C", { currency: undefined })];
  assert.equal(screenCandidates(rows, { ...EMPTY_FILTERS, minRsi: "110" }, "change").error, "invalid_filter");
  assert.equal(screenCandidates(rows, { ...EMPTY_FILTERS, minPrice: "10", maxPrice: "9" }, "change").error, "invalid_filter");
  assert.equal(screenCandidates(rows, EMPTY_FILTERS, "marketCap").error, "currency_required");
  assert.equal(screenCandidates(rows, { ...EMPTY_FILTERS, maxPrice: "100" }, "change").error, "currency_required");
  assert.deepEqual(screenCandidates(rows, { ...EMPTY_FILTERS, currency: "THB", maxPrice: "100" }, "price").stocks.map(({ symbol }) => symbol), ["B.BK"]);
  assert.equal(screenCandidates(rows, { ...EMPTY_FILTERS, minChange: "1", query: ".bk" }, "change").stocks.length, 1);
});

test("rankings sort signed momentum, skip unavailable metrics, and break ties by symbol", () => {
  const rows = [
    stock("BEAR", { momentumScore: -10, volatility: 10, changePercent: -3 }),
    stock("TIE-B", { momentumScore: 1, volatility: 12 }),
    stock("TIE-A", { momentumScore: 1, volatility: 12 }),
    stock("MISSING", { momentumScore: null, volatility: null, changePercent: null }),
    stock("FLAT", { momentumScore: 0, volatility: 0, changePercent: 0, currency: "THB" })
  ];
  const symbols = (type: Parameters<typeof rankCandidates>[0]) => rankCandidates(type, rows).map(({ symbol }) => symbol);
  assert.deepEqual(symbols("strongest-momentum"), ["TIE-A", "TIE-B", "FLAT", "BEAR"]);
  assert.deepEqual(symbols("lowest-volatility"), ["FLAT", "BEAR", "TIE-A", "TIE-B"]);
  assert.deepEqual(symbols("top-gainers"), ["TIE-A", "TIE-B"]);
  assert.deepEqual(symbols("top-losers"), ["BEAR"]);
  assert.ok(!symbols("highest-market-cap").includes("FLAT"));
});
