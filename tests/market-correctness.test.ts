import assert from "node:assert/strict";
import test from "node:test";
import { correlationStatistics } from "../lib/finance/correlation.ts";
import { alignPerformance, tradingDateFormatter } from "../lib/finance/trading-dates.ts";
import { valuePortfolio } from "../lib/finance/portfolio-valuation.ts";
import { buildDailySeries } from "../lib/indicators/daily-series.ts";

test("portfolio values comparable cost and market value independently for each currency", () => {
  const holdings = [
    ["A", "USD"], ["B", "USD"], ["C", "USD"], ["D", "USD"], ["E", "THB"]
  ].map(([symbol, currency]) => ({ key: symbol, symbol, currency, quantity: 2, cost: 100 }));
  const result = valuePortfolio(holdings, {
    A: { latestPrice: 60, currency: "USD" },
    C: { latestPrice: 60, currency: "THB" },
    D: { latestPrice: NaN, currency: "USD" },
    E: { latestPrice: 40, currency: "THB" }
  });
  assert.deepEqual(result.positions.map((position) => position.exclusion), [null, "missing-quote", "currency-mismatch", "invalid-quote", null]);
  assert.deepEqual(result.currencies.map(({ currency, status, comparableCost, unrealized }) => ({ currency, status, comparableCost, unrealized })), [
    { currency: "USD", status: "partial", comparableCost: 100, unrealized: 20 },
    { currency: "THB", status: "complete", comparableCost: 100, unrealized: -20 }
  ]);
  assert.equal(result.status, "partial");
  assert.equal(valuePortfolio(holdings, {}).currencies[0].unrealized, null);
});

function history(prices: number[]) {
  return prices.map((close, index) => ({
    date: new Date(Date.UTC(2025, 0, 1 + index)).toISOString().slice(0, 10),
    close, open: close, high: close, low: close, volume: 100
  }));
}

test("daily MA200 and crosses use calculation history across chart ranges", () => {
  for (const [last, expected] of [[200, "golden_cross"], [50, "death_cross"]] as const) {
    const bars = history([...Array<number>(200).fill(100), last]);
    const today = bars.at(-1)!.date;
    const short = buildDailySeries(bars, "1M", today, last);
    const weekly = buildDailySeries(bars, "5Y", today, last);
    assert.equal(short.movingAverages.crossSignal, expected);
    assert.deepEqual(short.movingAverages, weekly.movingAverages);
    assert.equal(short.indicators.sma200.at(-1), weekly.indicators.sma200.at(-1));
    assert.equal(short.chart.interval, "1d");
    assert.equal(weekly.chart.interval, "1wk");
    assert.equal(weekly.chart.indicatorInterval, "1d");
    assert.equal(buildDailySeries(bars.slice(1), "6M", today, last).movingAverages.crossSignal, "insufficient");
    assert.equal(buildDailySeries(bars.slice(2), "6M", today, last).movingAverages.ma200, null);
    const partial = buildDailySeries(bars, "1M", today, last, bars.at(-2)!.date);
    assert.equal(partial.movingAverages.crossSignal, "insufficient");
    assert.equal(partial.indicators.sma200.at(-1), null);
    const noComparableCurrency = buildDailySeries(bars, "6M", today, NaN);
    assert.notEqual(noComparableCurrency.movingAverages.ma200, null);
    assert.equal(noComparableCurrency.movingAverages.priceVsMA200, "insufficient");
  }
});

test("comparison rebases on shared dates and correlates matched return intervals", () => {
  const rows = (pairs: [number, number][]) => pairs.map(([day, close]) => ({ date: `2025-01-${String(day).padStart(2, "0")}`, close }));
  const left = rows([[1, 96], [2, 100], [3, 200], [4, 110], [6, 121], [7, 100], [9, 200]]);
  const right = rows([[2, 100], [4, 110], [5, 900], [6, 121], [7, 100], [8, 80]]);
  const aligned = alignPerformance([left, right])!;
  assert.equal(aligned.start, "2025-01-02");
  assert.equal(aligned.end, "2025-01-07");
  assert.equal(aligned.points[0][0].normalized, 100);
  assert.equal(aligned.points[1][0].normalized, 100);
  assert.equal(aligned.points[1].some(({ date }) => date === "2025-01-03"), false);
  assert.deepEqual(correlationStatistics(left, right), { value: 1, samples: 3 });
  assert.equal(alignPerformance([left, right.slice(0, 1)]), null);
  assert.equal(tradingDateFormatter("Asia/Bangkok")(new Date("2025-01-01T20:00:00Z")), "2025-01-02");
});
