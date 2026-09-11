import assert from "node:assert/strict";
import test from "node:test";
import { toHeikinAshi } from "../lib/analysis/heikin-ashi.ts";

test("Heikin-Ashi derives OHLC recursively while preserving date and volume", () => {
  const result = toHeikinAshi([
    { date: "2026-09-10", open: 100, high: 110, low: 95, close: 105, volume: 1000 },
    { date: "2026-09-11", open: 106, high: 114, low: 101, close: 112, volume: 1200 }
  ]);

  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    date: "2026-09-10",
    open: 102.5,
    high: 110,
    low: 95,
    close: 102.5,
    volume: 1000
  });
  assert.equal(result[1].open, 102.5);
  assert.equal(result[1].close, 108.25);
  assert.equal(result[1].high, 114);
  assert.equal(result[1].low, 101);
  assert.equal(result[1].volume, 1200);
});
