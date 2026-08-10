import assert from "node:assert/strict";
import test from "node:test";
import { en, th } from "../lib/i18n/messages.ts";

test("Thai and English dictionaries expose identical message keys", () => {
  assert.deepEqual(Object.keys(th).sort(), Object.keys(en).sort());
});

test("all localized messages are non-empty strings", () => {
  for (const [key, value] of Object.entries(en)) assert.ok(value.trim().length > 0, `English message ${key} is empty`);
  for (const [key, value] of Object.entries(th)) assert.ok(value.trim().length > 0, `Thai message ${key} is empty`);
});

test("critical navigation and stock-analysis copy differs by locale", () => {
  assert.notEqual(en["nav.home"], th["nav.home"]);
  assert.notEqual(en["stock.technicalOverview"], th["stock.technicalOverview"]);
  assert.notEqual(en["legal.disclaimerBody"], th["legal.disclaimerBody"]);
});
