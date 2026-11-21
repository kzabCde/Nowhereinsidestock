import type { MovingAverages, PriceZone } from "@/lib/types/market";

export type SignalScoreInput = {
  latestPrice: number;
  trend?: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  rsiSignal?: string;
  macdSignal?: string;
  momentumScore?: number | null;
  volume?: number | null;
  averageVolume?: number | null;
  supports?: PriceZone[];
  resistances?: PriceZone[];
};

export type SignalEvidenceCode =
  | "trendBullish"
  | "trendBearish"
  | "priceAboveMovingAverages"
  | "priceBelowMovingAverages"
  | "goldenCross"
  | "deathCross"
  | "macdBuy"
  | "macdSell"
  | "rsiOversold"
  | "rsiOverbought"
  | "momentumStrong"
  | "volumeWeak"
  | "volumeConfirm"
  | "nearSupport"
  | "nearResistance";

export type SignalEvidence = {
  code: SignalEvidenceCode;
  value?: number;
};

export type SignalScoreResult = {
  score: number;
  stance: "bullish" | "neutral" | "bearish";
  evidenceCompleteness: { available: number; total: number };
  statisticalConfidence: null;
  reasons: SignalEvidence[];
  cautions: SignalEvidence[];
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function nearestDistancePercent(price: number, zones: PriceZone[]): number | null {
  if (!Number.isFinite(price) || price <= 0 || zones.length === 0) return null;
  return Math.min(...zones.map((zone) => Math.abs(zone.level - price) / price * 100));
}

export function buildSignalScore(input: SignalScoreInput): SignalScoreResult {
  let score = 50;
  const reasons: SignalEvidence[] = [];
  const cautions: SignalEvidence[] = [];

  if (input.trend === "uptrend") {
    score += 14;
    reasons.push({ code: "trendBullish" });
  } else if (input.trend === "downtrend") {
    score -= 14;
    cautions.push({ code: "trendBearish" });
  }

  const ma = input.movingAverages;
  if (ma) {
    const aboveCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "above").length;
    const belowCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "below").length;
    if (aboveCount >= 2) {
      score += 10;
      reasons.push({ code: "priceAboveMovingAverages", value: aboveCount });
    } else if (belowCount >= 2) {
      score -= 10;
      cautions.push({ code: "priceBelowMovingAverages", value: belowCount });
    }

    if (ma.crossSignal === "golden_cross") {
      score += 10;
      reasons.push({ code: "goldenCross" });
    } else if (ma.crossSignal === "death_cross") {
      score -= 10;
      cautions.push({ code: "deathCross" });
    }
  }

  if (input.macdSignal === "buy") {
    score += 8;
    reasons.push({ code: "macdBuy" });
  } else if (input.macdSignal === "sell") {
    score -= 8;
    cautions.push({ code: "macdSell" });
  }

  if (input.rsiSignal === "oversold") {
    score += 4;
    reasons.push({ code: "rsiOversold" });
  } else if (input.rsiSignal === "overbought") {
    score -= 4;
    cautions.push({ code: "rsiOverbought" });
  }

  const momentumAvailable = typeof input.momentumScore === "number" && Number.isFinite(input.momentumScore);
  if (momentumAvailable && Math.abs(input.momentumScore!) >= 1) {
    const negative = input.momentumScore! < 0;
    score += negative ? -5 : 5;
    (negative ? cautions : reasons).push({ code: "momentumStrong", value: input.momentumScore! });
  }

  const volumeAvailable = typeof input.volume === "number" && Number.isFinite(input.volume) && input.volume >= 0 &&
    typeof input.averageVolume === "number" && Number.isFinite(input.averageVolume) && input.averageVolume > 0;
  if (volumeAvailable) {
    const ratio = input.volume! / input.averageVolume!;
    if (ratio >= 1.5) {
      if (input.trend === "downtrend" || input.macdSignal === "sell") {
        score -= 5;
        cautions.push({ code: "volumeWeak", value: ratio });
      } else {
        score += 5;
        reasons.push({ code: "volumeConfirm", value: ratio });
      }
    }
  }

  const supportDistance = nearestDistancePercent(input.latestPrice, (input.supports ?? []).filter(({ level }) => level > 0 && level <= input.latestPrice));
  const resistanceDistance = nearestDistancePercent(input.latestPrice, (input.resistances ?? []).filter(({ level }) => level >= input.latestPrice));
  if (supportDistance != null && supportDistance <= 2) {
    reasons.push({ code: "nearSupport" });
  }
  if (resistanceDistance != null && resistanceDistance <= 2) {
    score -= 3;
    cautions.push({ code: "nearResistance" });
  }

  const normalizedScore = Math.round(clamp(score, 0, 100));
  const stance = normalizedScore >= 62 ? "bullish" : normalizedScore <= 38 ? "bearish" : "neutral";
  const inputs = [
    input.trend != null,
    Boolean(ma && [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((value) => value !== "insufficient").length >= 2),
    Boolean(ma && ma.crossSignal !== "insufficient"),
    ["buy", "sell", "neutral"].includes(input.macdSignal ?? ""),
    ["overbought", "oversold", "neutral"].includes(input.rsiSignal ?? ""),
    momentumAvailable,
    volumeAvailable,
    supportDistance != null,
    resistanceDistance != null
  ];

  return {
    score: normalizedScore, stance, statisticalConfidence: null,
    evidenceCompleteness: { available: inputs.filter(Boolean).length, total: inputs.length },
    reasons, cautions
  };
}
