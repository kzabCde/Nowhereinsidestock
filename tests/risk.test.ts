import assert from "node:assert/strict";
import test from "node:test";
import { maxDrawdown, sharpeRatio, simpleReturns, sortinoRatio } from "../lib/finance/risk.ts";

test("simple returns are price-relative", () => {
  assert.deepEqual(simpleReturns([100, 110, 99]), [0.10000000000000009, -0.09999999999999998]);
});

test("max drawdown reports peak-to-trough loss as positive percent", () => {
  assert.equal(maxDrawdown([100, 120, 90, 110]), 25);
});

test("risk-adjusted ratios remain finite", () => {
  const prices = [100, 102, 101, 104, 103, 106, 105, 108];
  assert.ok(Number.isFinite(sharpeRatio(prices)));
  assert.ok(Number.isFinite(sortinoRatio(prices)));
});
