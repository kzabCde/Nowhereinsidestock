import assert from "node:assert/strict";
import test from "node:test";
import { backtestMovingAverageCross } from "../lib/analysis/backtest.ts";
import { buildSignalScore } from "../lib/analysis/signal-score.ts";
import { getNearestSupport, getNearestResistance } from "../lib/analysis/next-signal.ts";
import { directionalMomentum } from "../lib/indicators/technical.ts";
import type { Candle, PriceZone } from "../lib/types/market.ts";

const date = (index: number) => new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10);
const bars = (prices: number[], opens: Record<number, number> = {}): Candle[] => prices.map((close, index) => {
  const open = opens[index] ?? close;
  return { date: date(index), open, high: Math.max(open, close), low: Math.min(open, close), close, volume: 10 };
});
const closes = [...Array<number>(10).fill(100), 110, 110, 110, 110, ...Array<number>(10).fill(90)];

test("signals execute at the next open and equity is marked every observed trading day", () => {
  const result = backtestMovingAverageCross(bars(closes, { 11: 120, 15: 80 }), 2, 3, { initialCapital: 1200 });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  const [trade] = result.trades;
  assert.deepEqual([trade.signalDate, trade.entryDate, trade.entryPrice], [date(10), date(11), 120]);
  assert.deepEqual([trade.exitSignalDate, trade.exitDate, trade.exitPrice], [date(14), date(15), 80]);
  assert.equal(result.equityCurve[10].equity, 1200);
  assert.equal(result.equityCurve[11].equity, 1100);
  assert.equal(result.equityCurve[14].equity, 900);
  assert.equal(result.equityCurve[15].equity, 800);
  assert.equal(result.equityCurve.length, closes.length);
  assert.equal(result.totalReturn, -33.33);
  assert.equal(result.maxDrawdown, 33.33);
  assert.equal(result.buyAndHoldReturn, -10);
  assert.equal(result.winRate, 0);
});

test("commissions and slippage affect fills and benchmark consistently", () => {
  const result = backtestMovingAverageCross(bars(closes, { 11: 120, 15: 80 }), 2, 3, { initialCapital: 1200, feeBps: 100, slippageBps: 50 });
  assert.equal(result.status, "ok");
  if (result.status !== "ok") return;
  const fill = result.trades[0];
  const expected = (80 * 0.995 * 0.99) / (120 * 1.005 * 1.01);
  assert.ok(Math.abs(result.equityCurve.at(-1)!.equity - 1200 * expected) < 1e-8);
  assert.ok(Math.abs(fill.entryPrice - 120.6) < 1e-8);
  assert.equal(fill.exitPrice, 79.6);
  assert.equal(result.buyAndHoldReturn, -11.33);
});

test("zero trades, pending final signal, and open positions are distinct", () => {
  const flat = backtestMovingAverageCross(bars(Array<number>(30).fill(100)), 2, 3);
  assert.equal(flat.status, "ok");
  assert.equal(flat.totalReturn, 0);
  assert.equal(flat.winRate, null);
  const late = [...Array<number>(20).fill(100), 110];
  const pending = backtestMovingAverageCross(bars(late), 2, 3);
  assert.equal(pending.status === "ok" && pending.openPosition, null);
  const open = backtestMovingAverageCross(bars([...late, 121], { 21: 110 }), 2, 3);
  assert.equal(open.status, "ok");
  if (open.status !== "ok") return;
  assert.equal(open.trades.length, 0);
  assert.equal(open.openPosition?.entryDate, date(21));
  assert.equal(open.totalReturn, 10);
  assert.equal(open.winRate, null);
});

test("backtest validates inputs and splits contiguous history without carrying positions", () => {
  const history = bars(Array.from({ length: 120 }, (_, index) => 100 + 5 * Math.sin(index / 4)));
  const split = backtestMovingAverageCross(history, 4, 10);
  assert.equal(split.status, "ok");
  if (split.status !== "ok") return;
  assert.ok(split.inSample && split.outOfSample);
  assert.equal(split.inSample.end, date(83));
  assert.equal(split.outOfSample.start, date(84));
  assert.equal(split.outOfSample.equityCurve[0].equity, 10000);
  assert.ok(split.sensitivity.length);
  assert.equal(backtestMovingAverageCross(history.slice(0, 8), 4, 10).status, "insufficient_history");
  assert.equal(backtestMovingAverageCross(history, 4, 10, { feeBps: -1 }).status, "invalid_parameters");
  assert.equal(backtestMovingAverageCross([...history, history.at(-1)!], 4, 10).status, "invalid_bars");
  assert.equal(backtestMovingAverageCross([{ ...history[0], open: NaN }, ...history.slice(1)], 4, 10).status, "invalid_bars");
  const gap = backtestMovingAverageCross(history.filter((_, i) => i < 10 || i > 20), 4, 10);
  assert.equal(gap.status === "ok" && gap.longestGapDays, 12);
});

test("bearish momentum remains negative and evidence coverage never implies statistical confidence", () => {
  const bearishMomentum = directionalMomentum(-1, 1, 100);
  assert.equal(bearishMomentum, -2);
  const result = buildSignalScore({ latestPrice: 100, momentumScore: bearishMomentum });
  assert.equal(result.score, 45);
  assert.equal(result.statisticalConfidence, null);
  assert.deepEqual(result.evidenceCompleteness, { available: 1, total: 9 });
  assert.ok(result.cautions.some((reason) => reason.code === "momentumStrong"));
  const zone: PriceZone = { level: 110, lower: 109, upper: 111, touches: 2, strength: "medium", type: "support" };
  assert.equal(getNearestSupport(100, [zone]), null);
  assert.equal(getNearestResistance(120, [zone]), null);
});
