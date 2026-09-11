import assert from "node:assert/strict";
import test from "node:test";
import { calculatePositionSize } from "../lib/finance/position-sizing.ts";

test("position sizing respects risk budget and reward-to-risk", () => {
  const result = calculatePositionSize({
    accountSize: 10_000,
    riskPercent: 1,
    entryPrice: 100,
    stopPrice: 95,
    targetPrice: 110
  });

  assert.equal(result.direction, "long");
  assert.equal(result.riskBudget, 100);
  assert.equal(result.riskPerShare, 5);
  assert.equal(result.shares, 20);
  assert.equal(result.positionValue, 2_000);
  assert.equal(result.maxLoss, 100);
  assert.equal(result.rewardRiskRatio, 2);
  assert.equal(result.potentialReward, 200);
  assert.ok(Math.abs((result.breakevenWinRate ?? 0) - 33.333333333333336) < 1e-9);
  assert.equal(result.limitedByCapital, false);
});

test("cash-only sizing caps shares when risk sizing exceeds available capital", () => {
  const result = calculatePositionSize({
    accountSize: 1_000,
    riskPercent: 10,
    entryPrice: 400,
    stopPrice: 399,
    targetPrice: 405
  });

  assert.equal(result.riskBasedShares, 100);
  assert.equal(result.capitalBasedShares, 2);
  assert.equal(result.shares, 2);
  assert.equal(result.positionValue, 800);
  assert.equal(result.maxLoss, 2);
  assert.equal(result.limitedByCapital, true);
});

test("short plans calculate directional targets without assuming leverage", () => {
  const result = calculatePositionSize({
    accountSize: 10_000,
    riskPercent: 1,
    entryPrice: 100,
    stopPrice: 105,
    targetPrice: 90
  });

  assert.equal(result.direction, "short");
  assert.equal(result.shares, 20);
  assert.equal(result.rewardRiskRatio, 2);
  assert.equal(result.potentialReward, 200);
});

test("invalid inputs are rejected and wrong-side targets omit reward metrics", () => {
  assert.throws(() => calculatePositionSize({ accountSize: 0, riskPercent: 1, entryPrice: 100, stopPrice: 95 }));
  assert.throws(() => calculatePositionSize({ accountSize: 10_000, riskPercent: 1, entryPrice: 100, stopPrice: 100 }));

  const result = calculatePositionSize({
    accountSize: 10_000,
    riskPercent: 1,
    entryPrice: 100,
    stopPrice: 95,
    targetPrice: 90
  });
  assert.equal(result.rewardRiskRatio, null);
  assert.equal(result.potentialReward, null);
});
