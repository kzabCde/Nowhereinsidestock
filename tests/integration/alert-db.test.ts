import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { Pool } from "pg";
import { alertRepository, inboxDelivery } from "../../lib/alerts/postgres.ts";
import { runAlertWorker } from "../../lib/alerts/worker.ts";

const connectionString = process.env.NIS_ALERT_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Set NIS_ALERT_TEST_DATABASE_URL to a dedicated loopback PostgreSQL test database.");
const url = new URL(connectionString);
if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !/^\/[a-zA-Z0-9_]+_test$/.test(url.pathname) || url.search) {
  throw new Error("Database integration tests require a local _test database and a connection URL without query overrides.");
}

test("PostgreSQL evaluation locks and delivery leases survive duplicates and retry", async (context) => {
  const schema = `alert_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Pool({ connectionString });
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new Pool({ connectionString, options: `-c search_path=${schema}` });
  context.after(async () => {
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  const sql = await readFile(new URL("../../db/migrations/001_alert_worker.sql", import.meta.url), "utf-8");
  await pool.query(sql);
  const alertId = randomUUID();
  const ownerId = randomUUID();
  const t0 = new Date().toISOString();
  const t1 = new Date(Date.parse(t0) + 120_000).toISOString();
  const t2 = new Date(Date.parse(t1) + 60_000).toISOString();
  await pool.query("INSERT INTO nis_alert_definitions (id, owner_id, symbol, kind, threshold, next_check_at) VALUES ($1, $2, 'AAPL', 'price_above', 100, $3)", [alertId, ownerId, t0]);
  const repo = alertRepository(pool);
  const load = (value: number, asOf: string) => async () => ({ price: { value, asOf, stale: false, currency: "USD" } });
  assert.equal((await runAlertWorker(repo, load(90, t0), undefined, t0)).checked, 1);
  const fail = async () => { throw Error("Mock delivery error"); };
  const duplicate = await Promise.all([
    runAlertWorker(repo, load(110, t1), fail, t1),
    runAlertWorker(repo, load(110, t1), fail, t1)
  ]);
  assert.equal(duplicate.reduce((sum, step) => sum + step.checked, 0), 1);
  assert.equal(duplicate.reduce((sum, step) => sum + step.deliveryErrors, 0), 1);
  const pending = (await pool.query("SELECT owner_id, attempts, delivery, last_error FROM nis_alert_events")).rows;
  assert.deepEqual(pending, [{ owner_id: ownerId, attempts: 1, delivery: "pending", last_error: "delivery_failed" }]);
  assert.equal((await pool.query("SELECT count(*)::int AS count FROM nis_alert_checks")).rows[0].count, 2);
  const adapter = inboxDelivery(pool);
  const delivered = await runAlertWorker(repo, load(110, t1), async (message) => {
    await adapter(message);
    await adapter(message); // Reprocessing the same durable event is safe.
  }, t2);
  assert.equal(delivered.delivered, 1);
  assert.deepEqual((await pool.query("SELECT owner_id FROM nis_alert_inbox")).rows, [{ owner_id: ownerId }]);
  assert.deepEqual((await pool.query("SELECT delivery, attempts FROM nis_alert_events")).rows, [{ delivery: "delivered", attempts: 2 }]);
});
