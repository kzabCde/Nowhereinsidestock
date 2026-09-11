import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMarketTimeIso } from "../lib/format/market-time.ts";

test("market time accepts Date and Unix timestamp inputs", () => {
  const expected = "2026-09-11T20:00:00.000Z";
  const date = new Date(expected);
  assert.equal(normalizeMarketTimeIso(date), expected);
  assert.equal(normalizeMarketTimeIso(date.getTime()), expected);
  assert.equal(normalizeMarketTimeIso(date.getTime() / 1000), expected);
});

test("market time recovers the historical Date-times-1000 conversion bug", () => {
  const actual = new Date("2026-09-11T20:00:00.000Z");
  const malformed = new Date(actual.getTime() * 1000).toISOString();
  assert.equal(normalizeMarketTimeIso(malformed), actual.toISOString());
});

test("market time falls back to the latest candle time when input is invalid", () => {
  const fallback = "2026-09-11T13:30:00.000Z";
  assert.equal(normalizeMarketTimeIso("not-a-date", fallback), fallback);
});
