import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAlert, validateAlert, type AlertDefinition, type AlertEvaluation } from "../lib/alerts/evaluate.ts";
import { createWorkerHandler } from "../lib/alerts/worker-handler.ts";
import { runAlertWorker, type AlertRepository, type Delivery } from "../lib/alerts/worker.ts";

const observed = (step: number) => `2025-02-04T15:${String(step).padStart(2, "0")}:00Z`;
const price = (value: number, step: number, stale = false, currency = "USD") => ({
  price: { value, asOf: observed(step), currency, stale }
});
const definition: AlertDefinition = {
  id: "alert", symbol: "AAPL", enabled: true, type: "price_above", threshold: 100, createdAt: observed(0)
};

test("threshold transitions fire once and re-arm after leaving the condition", () => {
  const observations = [101, 102, 100, 110, 120, 90, 101];
  const events: number[] = [];
  let state: AlertEvaluation = {};
  for (const [step, value] of observations.entries()) {
    const evaluation = evaluateAlert(definition, state, price(value, step), observed(step));
    if (evaluation.event) events.push(step);
    state = evaluation.state;
  }
  assert.deepEqual(events, [3, 6]);
  assert.equal(state.triggeredAt, observed(6));
  assert.equal(state.condition, true);
  const repeat = evaluateAlert(definition, state, price(80, 6), observed(7));
  assert.equal(repeat.state.condition, true);
  assert.equal(repeat.event, undefined);
});

test("price-below and RSI thresholds handle equality, invalid values, pause and stale data", () => {
  const below: AlertDefinition = { ...definition, type: "price_below" };
  const initial = evaluateAlert(below, {}, price(100, 0), observed(0));
  assert.equal(initial.state.condition, false);
  const stale = evaluateAlert(below, initial.state, price(10, 1, true), observed(1));
  assert.equal(stale.state.error, "stale_data");
  assert.equal(stale.state.condition, false);
  assert.equal(evaluateAlert(below, stale.state, price(10, 2, false, "THB"), observed(2)).state.error, "currency_changed");
  assert.ok(evaluateAlert(below, stale.state, price(99, 2), observed(2)).event);
  assert.deepEqual(evaluateAlert({ ...below, enabled: false }, stale.state, price(99, 2), observed(2)).state, stale.state);
  assert.throws(() => validateAlert({ ...below, threshold: 0 }));
  assert.throws(() => validateAlert({ ...below, type: "rsi_above", threshold: 101 }));
  for (const type of ["rsi_above", "rsi_below"] as const) {
    const rule = { ...definition, type, threshold: 50 };
    const first = evaluateAlert(rule, {}, { daily: { date: "2025-02-03", cross: "none", rsi: 50, stale: false } }, observed(2));
    const result = evaluateAlert(rule, first.state, { daily: { date: "2025-02-04", cross: "none", rsi: type === "rsi_above" ? 51 : 49, stale: false } }, observed(3));
    assert.ok(result.event);
  }
});

test("crossover alerts use the completed trading date and deduplicate events", () => {
  for (const type of ["golden_cross", "death_cross"] as const) {
    const rule = { ...definition, type };
    const reading = { daily: { date: "2025-02-04", cross: type, rsi: null, stale: false } };
    const historic = evaluateAlert(rule, {}, { daily: { ...reading.daily, date: "2025-02-03" } }, observed(0));
    assert.equal(historic.event, undefined);
    const first = evaluateAlert(rule, historic.state, reading, observed(1));
    assert.equal(first.event?.key, `${type}:2025-02-04`);
    assert.equal(evaluateAlert(rule, first.state, reading, observed(2)).event, undefined);
    assert.equal(evaluateAlert(rule, first.state, { daily: { ...reading.daily, cross: "insufficient" } }, observed(3)).state.error, "insufficient_history");
  }
});

test("worker handler is disabled by default and requires the scoped bearer secret", async () => {
  const secret = "local-test-secret-longer-than-thirty-two";
  let ran = 0;
  const request = (token?: string) => new Request("https://unit.test/api/internal/alert-worker", {
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });
  const disabled = createWorkerHandler(() => ({ enabled: false, secret }), async () => ++ran);
  const enabled = createWorkerHandler(() => ({ enabled: true, secret }), async () => ++ran);
  assert.equal((await disabled(request(secret))).status, 404);
  assert.equal((await enabled(request())).status, 401);
  assert.equal((await enabled(request("invalid"))).status, 401);
  const result = await enabled(request(secret));
  assert.equal(result.status, 200);
  assert.equal(await result.json(), 1);
});

test("worker coalesces provider loads and reports failed and disabled delivery states", async () => {
  let loads = 0;
  const states: string[] = [];
  const alert = { ...definition, ownerId: "owner" };
  const message = { alertId: "alert", ownerId: "owner", eventKey: "observation", attempts: 1, leaseId: "lease" } as Delivery;
  const repository: AlertRepository = {
    due: async () => [alert, { ...alert, id: "other-alert" }],
    evaluate: async () => true,
    claim: async () => [message],
    finish: async (_, result) => { states.push(result); }
  };
  const load = async () => { loads += 1; return price(110, 3); };
  assert.equal((await runAlertWorker(repository, load, async () => { throw Error("unavailable"); })).deliveryErrors, 1);
  assert.equal(loads, 1);
  assert.equal((await runAlertWorker(repository, load)).disabled, 1);
  assert.deepEqual(states, ["retry", "disabled"]);
});
