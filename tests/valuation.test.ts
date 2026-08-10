import assert from "node:assert/strict";
import test from "node:test";
import { dividendDiscountValue, grahamNumber, peFairValue } from "../lib/finance/valuation.ts";

test("P/E valuation multiplies positive EPS by target multiple", () => {
  assert.equal(peFairValue(5, 20), 100);
  assert.equal(peFairValue(-1, 20), null);
});

test("Graham Number uses the standard 22.5 factor", () => {
  assert.equal(Number(grahamNumber(5, 20)?.toFixed(4)), Number(Math.sqrt(2250).toFixed(4)));
  assert.equal(grahamNumber(5, 0), null);
});

test("DDM requires required return to exceed growth", () => {
  assert.equal(dividendDiscountValue(2, 10, 5), 40);
  assert.equal(dividendDiscountValue(2, 5, 5), null);
  assert.equal(dividendDiscountValue(-1, 10, 5), null);
});
