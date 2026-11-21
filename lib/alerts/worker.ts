import { evaluateAlert, isPriceAlert, type AlertDefinition, type AlertEvaluation, type AlertEvent, type AlertReading } from "./evaluate.ts";

export type OwnedAlert = AlertDefinition & { ownerId: string };
export type Delivery = { alertId: string; eventKey: string; ownerId: string; leaseId: string; attempts: number; payload: AlertEvent };

export type AlertRepository = {
  due: (now: string, limit: number) => Promise<OwnedAlert[]>;
  evaluate: (candidate: OwnedAlert, now: string, reading: AlertReading) => Promise<boolean>;
  claim: (now: string, limit: number) => Promise<Delivery[]>;
  finish: (delivery: Delivery, state: "delivered" | "disabled" | "retry", now: string) => Promise<void>;
};

export type DeliveryAdapter = (message: Delivery) => Promise<void>;

export function runEvaluation(alert: OwnedAlert, previous: AlertEvaluation, reading: AlertReading, now: string) {
  return { ...evaluateAlert(alert, previous, reading, now), intervalMs: isPriceAlert(alert.type) ? 120_000 : 300_000 };
}

export async function runAlertWorker(
  repository: AlertRepository,
  load: (symbol: string, prices: boolean) => Promise<AlertReading>,
  deliver?: DeliveryAdapter,
  now = new Date().toISOString()
) {
  const candidates = await repository.due(now, 12);
  const inFlight = new Map<string, Promise<AlertReading>>();
  const evaluated = await Promise.all(candidates.map(async (alert) => {
    const prices = isPriceAlert(alert.type);
    const key = `${alert.symbol}:${prices}`;
    if (!inFlight.has(key)) inFlight.set(key, Promise.resolve().then(() => load(alert.symbol, prices)).catch(() => ({})));
    return repository.evaluate(alert, now, await inFlight.get(key)!);
  }));
  const messages = await repository.claim(now, 12);
  const summaries = await Promise.all(messages.map(async (message) => {
    let result: "disabled" | "delivered" | "retry" = "disabled";
    if (deliver) {
      try {
        await deliver(message);
        result = "delivered";
      } catch {
        result = "retry";
      }
    }
    await repository.finish(message, result, now);
    return result;
  }));
  return {
    checked: evaluated.filter(Boolean).length,
    delivered: summaries.filter((value) => value === "delivered").length,
    disabled: summaries.filter((value) => value === "disabled").length,
    deliveryErrors: summaries.filter((value) => value === "retry").length
  };
}
