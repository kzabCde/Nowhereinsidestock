import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { AlertEvaluation, AlertReading, AlertType } from "./evaluate.ts";
import { runEvaluation, type AlertRepository, type Delivery, type OwnedAlert } from "./worker.ts";

type Row = {
  id: string; owner_id: string; symbol: string; kind: AlertType; threshold: number | null;
  created_at: Date; armed_at: Date | null; enabled: boolean; state: AlertEvaluation;
};
const MAX_ATTEMPTS = 5;

function definition(row: Row): OwnedAlert {
  return {
    id: row.id, ownerId: row.owner_id, symbol: row.symbol, type: row.kind, enabled: row.enabled,
    threshold: row.threshold ?? undefined, createdAt: row.created_at.toISOString(), armedAt: row.armed_at?.toISOString()
  };
}

export function openAlertDatabase(connectionString: string) {
  return new Pool({ connectionString, max: 4, connectionTimeoutMillis: 4000, statement_timeout: 5000 });
}

export function alertRepository(pool: Pool): AlertRepository {
  return {
    async due(now, limit) {
      const result = await pool.query<Row>(
        "SELECT * FROM nis_alert_definitions WHERE enabled AND next_check_at <= $1 ORDER BY next_check_at, id LIMIT $2", [now, limit]
      );
      return result.rows.map(definition);
    },

    async evaluate(candidate: OwnedAlert, now: string, reading: AlertReading) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await client.query<Row>(
          "SELECT * FROM nis_alert_definitions WHERE id = $1 AND owner_id = $2 AND enabled AND next_check_at <= $3 FOR UPDATE",
          [candidate.id, candidate.ownerId, now]
        );
        const row = result.rows[0];
        if (!row || row.kind !== candidate.type || row.symbol !== candidate.symbol || (row.threshold ?? undefined) !== candidate.threshold ||
          row.armed_at?.toISOString() !== candidate.armedAt) {
          await client.query("COMMIT");
          return false;
        }
        const { state, event, intervalMs } = runEvaluation(definition(row), row.state, reading, now);
        const next = new Date(Date.parse(now) + intervalMs).toISOString();
        await client.query(
          "UPDATE nis_alert_definitions SET state = $1, next_check_at = $2 WHERE id = $3 AND owner_id = $4",
          [state, next, row.id, row.owner_id]
        );
        await client.query(
          `INSERT INTO nis_alert_checks (owner_id, alert_id, checked_at, observation, condition_met, error_code)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
          [row.owner_id, row.id, now, state.observation, state.error ? null : state.condition, state.error]
        );
        if (event) await client.query(
          `INSERT INTO nis_alert_events (owner_id, alert_id, event_key, payload, next_attempt_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT DO NOTHING`,
          [row.owner_id, row.id, event.key, event, now]
        );
        await client.query("COMMIT");
        return true;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async claim(now, limit) {
      await pool.query(
        `UPDATE nis_alert_events SET delivery = 'failed', lease_until = NULL, lease_id = NULL, updated_at = $1,
           last_error = 'delivery_lease_expired'
         WHERE delivery = 'processing' AND lease_until <= $1 AND attempts >= $2`, [now, MAX_ATTEMPTS]
      );
      const result = await pool.query<Delivery>(
        `WITH due AS (
           SELECT alert_id, event_key FROM nis_alert_events
           WHERE attempts < $4 AND (
             (delivery = 'pending' AND next_attempt_at <= $1) OR (delivery = 'processing' AND lease_until <= $1)
           )
           ORDER BY next_attempt_at, alert_id, event_key LIMIT $2 FOR UPDATE SKIP LOCKED
         )
         UPDATE nis_alert_events AS event SET delivery = 'processing', lease_id = $3,
           lease_until = $1::timestamptz + interval '2 minutes', attempts = event.attempts + 1, updated_at = $1
         FROM due WHERE event.alert_id = due.alert_id AND event.event_key = due.event_key
         RETURNING event.alert_id AS "alertId", event.event_key AS "eventKey", event.owner_id AS "ownerId",
           event.lease_id AS "leaseId", event.attempts, event.payload`,
        [now, limit, randomUUID(), MAX_ATTEMPTS]
      );
      return result.rows;
    },

    async finish(message, result, now) {
      const state = result === "retry" ? message.attempts >= MAX_ATTEMPTS ? "failed" : "pending" : result;
      const retryAt = new Date(Date.parse(now) + 60_000 * 2 ** (message.attempts - 1)).toISOString();
      await pool.query(
        `UPDATE nis_alert_events SET delivery = $1, updated_at = $2, next_attempt_at = $3, lease_id = NULL,
           lease_until = NULL, last_error = $4
         WHERE alert_id = $5 AND owner_id = $6 AND event_key = $7 AND lease_id = $8 AND delivery = 'processing'`,
        [state, now, retryAt, result === "retry" ? "delivery_failed" : null, message.alertId,
          message.ownerId, message.eventKey, message.leaseId]
      );
    }
  };
}

export function inboxDelivery(pool: Pool) {
  return async (message: Delivery) => {
    await pool.query(
      `INSERT INTO nis_alert_inbox (owner_id, alert_id, event_key, payload)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
      [message.ownerId, message.alertId, message.eventKey, message.payload]
    );
  };
}
