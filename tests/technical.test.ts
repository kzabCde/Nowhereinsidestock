import assert from "node:assert/strict";
import test from "node:test";
import { ema, macd, normalizedMomentum, rsi, sma, volatility } from "../lib/indicators/technical.ts";

test("SMA uses a rolling window and preserves warm-up nulls", () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test("EMA starts with an SMA seed at period - 1", () => {
  assert.deepEqual(ema([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test("RSI emits its first value at the standard period index", () => {
  const result = rsi([1, 2, 3, 4, 5, 6], 3);
  assert.equal(result[2], null);
  assert.equal(result[3], 100);
});

test("flat prices produce neutral RSI", () => {
  assert.equal(rsi([10, 10, 10, 10, 10], 3)[3], 50);
});

test("MACD does not fabricate zero values during warm-up", () => {
  const prices = Array.from({ length: 40 }, (_, i) => i + 1);
  const { line, signal } = macd(prices);
  assert.equal(line[24], null);
  assert.notEqual(line[25], null);
  assert.equal(signal[32], null);
  assert.notEqual(signal[33], null);
});

test("annualized volatility is computed from log returns", () => {
  assert.equal(volatility([100, 100, 100, 100]), 0);
  assert.ok(volatility([100, 102, 101, 104, 103]) > 0);
});

test("momentum is normalized by price", () => {
  assert.equal(normalizedMomentum(2, 1, 100), 1);
  assert.equal(normalizedMomentum(2, 1, 1000), 0.1);
});
