import assert from "node:assert/strict";
import test from "node:test";
import { backtestMovingAverageCross } from "../lib/analysis/backtest.ts";
import { buildSignalScore } from "../lib/analysis/signal-score.ts";
import { buildCorrelationMatrix, pearsonCorrelation } from "../lib/finance/correlation.ts";
import type { Candle, MovingAverages } from "../lib/types/market.ts";

const bullishMa: MovingAverages = {
  ma20: 110,
  ma50: 105,
  ma200: 90,
  priceVsMA20: "above",
  priceVsMA50: "above",
  priceVsMA200: "above",
  crossSignal: "golden_cross"
};

test("signal score explains strongly aligned bullish evidence", () => {
  const result = buildSignalScore({
    latestPrice: 120,
    trend: "uptrend",
    movingAverages: bullishMa,
    macdSignal: "buy",
    rsiSignal: "neutral",
    momentumScore: 1.2,
    volume: 2_000_000,
    averageVolume: 1_000_000
  });
  assert.equal(result.stance, "bullish");
  assert.ok(result.score >= 80);
  assert.ok(result.reasons.length >= 3);
});

test("signal score penalizes bearish alignment", () => {
  const result = buildSignalScore({
    latestPrice: 80,
    trend: "downtrend",
    movingAverages: { ...bullishMa, priceVsMA20: "below", priceVsMA50: "below", priceVsMA200: "below", crossSignal: "death_cross" },
    macdSignal: "sell",
    rsiSignal: "overbought"
  });
  assert.equal(result.stance, "bearish");
  assert.ok(result.score <= 20);
});

test("moving-average backtest returns finite educational metrics", () => {
  const candles: Candle[] = Array.from({ length: 90 }, (_, index) => {
    const wave = index < 35 ? 100 - index * 0.3 : index < 65 ? 89.5 + (index - 35) * 1.1 : 122.5 - (index - 65) * 0.8;
    return { date: new Date(2026, 0, index + 1).toISOString(), open: wave, high: wave + 1, low: wave - 1, close: wave, volume: 1_000_000 };
  });
  const result = backtestMovingAverageCross(candles, 5, 15);
  assert.ok(Number.isFinite(result.totalReturn));
  assert.ok(Number.isFinite(result.buyAndHoldReturn));
  assert.ok(result.trades.length >= 1);
});

test("pearson correlation uses aligned daily returns", () => {
  const a = [
    { date: "2026-01-01", close: 100 },
    { date: "2026-01-02", close: 110 },
    { date: "2026-01-03", close: 121 },
    { date: "2026-01-04", close: 108.9 },
    { date: "2026-01-05", close: 119.79 }
  ];
  const b = a.map((point) => ({ ...point, close: point.close * 2 }));
  assert.equal(pearsonCorrelation(a, b), 1);
});

test("correlation matrix has 1 on diagonal", () => {
  const points = [
    { date: "2026-01-01", close: 100 },
    { date: "2026-01-02", close: 101 },
    { date: "2026-01-03", close: 99 },
    { date: "2026-01-04", close: 102 }
  ];
  const matrix = buildCorrelationMatrix([{ symbol: "AAA", points }, { symbol: "BBB", points }]);
  assert.equal(matrix[0]?.values.AAA, 1);
  assert.equal(matrix[0]?.values.BBB, 1);
});
