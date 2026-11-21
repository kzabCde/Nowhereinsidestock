import { normalizeSymbol } from "../services/market-errors.ts";
import type { MovingAverageCrossSignal } from "../types/market.ts";

export const ALERT_TYPES = ["price_above", "price_below", "rsi_above", "rsi_below", "golden_cross", "death_cross"] as const;
export type AlertType = typeof ALERT_TYPES[number];
export type AlertDefinition = {
  id: string;
  symbol: string;
  type: AlertType;
  threshold?: number;
  enabled: boolean;
  createdAt: string;
  armedAt?: string;
};

export type AlertReading = {
  price?: { value: number; currency?: string; asOf?: string; stale: boolean };
  daily?: { rsi: number | null; cross: MovingAverageCrossSignal; date?: string; stale: boolean };
};
export type AlertEvaluation = {
  checkedAt?: string;
  triggeredAt?: string;
  observation?: string;
  condition?: boolean;
  eventKey?: string;
  value?: number | string;
  currency?: string;
  error?: "quote_unavailable" | "insufficient_history" | "stale_data" | "invalid_threshold" | "currency_changed";
};
export type AlertEvent = {
  alertId: string;
  symbol: string;
  type: AlertType;
  key: string;
  observedAt: string;
  triggeredAt: string;
};

export function isPriceAlert(type: AlertType) {
  return type === "price_above" || type === "price_below";
}

export function isRsiAlert(type: AlertType) {
  return type === "rsi_above" || type === "rsi_below";
}

export function validateAlert<T extends Pick<AlertDefinition, "symbol" | "type" | "threshold">>(alert: T): T {
  if (!ALERT_TYPES.includes(alert.type)) throw Error("invalid_type");
  if (isPriceAlert(alert.type) || isRsiAlert(alert.type)) {
    const threshold = alert.threshold;
    if (threshold == null || !Number.isFinite(threshold) || (isPriceAlert(alert.type) ? threshold <= 0 : threshold < 0 || threshold > 100)) throw Error("invalid_threshold");
  }
  return { ...alert, symbol: normalizeSymbol(alert.symbol) };
}

export function evaluateAlert(alert: AlertDefinition, previous: AlertEvaluation, reading: AlertReading, now: string): {
  state: AlertEvaluation; event?: AlertEvent
} {
  if (!alert.enabled) return { state: previous };
  const fail = (error: AlertEvaluation["error"]) => ({ state: { ...previous, checkedAt: now, error } });

  try { validateAlert(alert); } catch { return fail("invalid_threshold"); }

  let condition: boolean;
  let observation: string;
  let value: number | string;
  let currency = previous.currency;
  const price = isPriceAlert(alert.type);
  const rsi = isRsiAlert(alert.type);
  if (price) {
    const data = reading.price;
    if (data?.stale) return fail("stale_data");
    if (!data?.asOf || !data.currency || !Number.isFinite(data.value) || data.value <= 0) return fail("quote_unavailable");
    if (currency && data.currency !== currency) return fail("currency_changed");
    currency = data.currency;
    observation = data.asOf;
    value = data.value;
    condition = alert.type === "price_above" ? value > alert.threshold! : value < alert.threshold!;
  } else {
    const data = reading.daily;
    if (data?.stale) return fail("stale_data");
    if (!data?.date) return fail("insufficient_history");
    observation = data.date.slice(0, 10);
    if (rsi) {
      if (data.rsi == null || !Number.isFinite(data.rsi) || data.rsi < 0 || data.rsi > 100) return fail("insufficient_history");
      value = data.rsi;
      condition = alert.type === "rsi_above" ? value > alert.threshold! : value < alert.threshold!;
    } else {
      if (data.cross === "insufficient") return fail("insufficient_history");
      value = data.cross;
      condition = value === alert.type;
    }
  }
  const observed = Date.parse(observation);
  if (!Number.isFinite(observed) || observed > Date.parse(now) + 86400000) return fail("stale_data");
  if (previous.observation && observed < Date.parse(previous.observation)) return fail("stale_data");
  if (previous.observation && observed === Date.parse(previous.observation)) {
    return { state: { ...previous, checkedAt: now, error: undefined } };
  }

  const key = `${alert.type}:${observation}`;
  const newCondition = price || rsi
    ? previous.condition === false
    : previous.observation != null && observation >= (alert.armedAt ?? alert.createdAt).slice(0, 10);
  const triggered = condition && newCondition && previous.eventKey !== key;
  const state = {
    ...previous, condition, observation, value, currency, checkedAt: now, error: undefined,
    ...(triggered ? { eventKey: key, triggeredAt: now } : {})
  };
  return triggered ? { state, event: { alertId: alert.id, symbol: alert.symbol, type: alert.type, key, observedAt: observation, triggeredAt: now } } : { state };
}
