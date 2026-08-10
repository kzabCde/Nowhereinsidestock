import type { MovingAverages, PriceZone } from "@/lib/types/market";

export type NextSignalCode =
  | "nearResistance"
  | "nearSupport"
  | "aboveKeyMovingAverages"
  | "belowKeyMovingAverages"
  | "rsiOverbought"
  | "rsiOversold"
  | "volumeAboveAverage"
  | "macdPositive"
  | "macdWeak"
  | "waitForConfirmation";

export type NextSignal = {
  code: NextSignalCode;
  tone: "positive" | "neutral" | "negative" | "warning";
};

export type NextSignalInput = {
  latestPrice: number;
  trend: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  supportResistance?: { supports: PriceZone[]; resistances: PriceZone[] };
  rsiSignal?: string;
  macdSignal?: string;
  volume?: number | null;
  averageVolume?: number | null;
};

const normalizeSignal = (value: string | undefined): string => value?.trim().toLowerCase() ?? "";
const isFinitePrice = (value: number): boolean => Number.isFinite(value) && value > 0;

export function getNearestSupport(latestPrice: number, supports: PriceZone[]): PriceZone | null {
  if (!isFinitePrice(latestPrice) || supports.length === 0) return null;
  const validSupports = supports.filter((zone) => Number.isFinite(zone.level));
  const supportsBelowPrice = validSupports.filter((zone) => zone.level <= latestPrice);
  const candidates = supportsBelowPrice.length > 0 ? supportsBelowPrice : validSupports;
  return candidates.reduce<PriceZone | null>((nearest, zone) => {
    if (!nearest) return zone;
    return Math.abs(latestPrice - zone.level) < Math.abs(latestPrice - nearest.level) ? zone : nearest;
  }, null);
}

export function getNearestResistance(latestPrice: number, resistances: PriceZone[]): PriceZone | null {
  if (!isFinitePrice(latestPrice) || resistances.length === 0) return null;
  const validResistances = resistances.filter((zone) => Number.isFinite(zone.level));
  const resistancesAbovePrice = validResistances.filter((zone) => zone.level >= latestPrice);
  const candidates = resistancesAbovePrice.length > 0 ? resistancesAbovePrice : validResistances;
  return candidates.reduce<PriceZone | null>((nearest, zone) => {
    if (!nearest) return zone;
    return Math.abs(latestPrice - zone.level) < Math.abs(latestPrice - nearest.level) ? zone : nearest;
  }, null);
}

export function isNearLevel(price: number, level: number, tolerancePercent = 2): boolean {
  if (!isFinitePrice(price) || !isFinitePrice(level) || tolerancePercent < 0) return false;
  return Math.abs(price - level) / price <= tolerancePercent / 100;
}

export function buildNextSignals(data: NextSignalInput): NextSignal[] {
  const signals: NextSignal[] = [];
  const nearestSupport = getNearestSupport(data.latestPrice, data.supportResistance?.supports ?? []);
  const nearestResistance = getNearestResistance(data.latestPrice, data.supportResistance?.resistances ?? []);
  const movingAverages = data.movingAverages;
  const rsiSignal = normalizeSignal(data.rsiSignal);
  const macdSignal = normalizeSignal(data.macdSignal);
  const hasAboveAverageVolume = typeof data.volume === "number" && typeof data.averageVolume === "number" && data.averageVolume > 0 && data.volume > data.averageVolume;

  if (nearestResistance && isNearLevel(data.latestPrice, nearestResistance.level)) signals.push({ code: "nearResistance", tone: "warning" });
  if (nearestSupport && isNearLevel(data.latestPrice, nearestSupport.level)) signals.push({ code: "nearSupport", tone: "neutral" });
  if (movingAverages?.priceVsMA20 === "above" && movingAverages.priceVsMA50 === "above") signals.push({ code: "aboveKeyMovingAverages", tone: "positive" });
  if (movingAverages?.priceVsMA20 === "below" && movingAverages.priceVsMA50 === "below") signals.push({ code: "belowKeyMovingAverages", tone: "negative" });
  if (rsiSignal === "overbought") signals.push({ code: "rsiOverbought", tone: "warning" });
  if (rsiSignal === "oversold") signals.push({ code: "rsiOversold", tone: "neutral" });
  if (hasAboveAverageVolume) signals.push({ code: "volumeAboveAverage", tone: "neutral" });
  if (macdSignal === "buy") signals.push({ code: "macdPositive", tone: "positive" });
  if (macdSignal === "sell") signals.push({ code: "macdWeak", tone: "negative" });
  if (signals.length === 0) signals.push({ code: "waitForConfirmation", tone: data.trend === "uptrend" ? "positive" : data.trend === "downtrend" ? "negative" : "neutral" });
  return signals;
}
