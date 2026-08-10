import type { MovingAverages, PriceZone } from "@/lib/types/market";

export type SignalScoreInput = {
  latestPrice: number;
  trend: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  rsiSignal?: string;
  macdSignal?: string;
  momentumScore?: number;
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
  confidence: "high" | "medium" | "low";
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
  let evidence = 0;
  const reasons: SignalEvidence[] = [];
  const cautions: SignalEvidence[] = [];

  if (input.trend === "uptrend") {
    score += 14;
    evidence += 1;
    reasons.push({ code: "trendBullish" });
  } else if (input.trend === "downtrend") {
    score -= 14;
    evidence += 1;
    cautions.push({ code: "trendBearish" });
  }

  const ma = input.movingAverages;
  if (ma) {
    const aboveCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "above").length;
    const belowCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "below").length;
    if (aboveCount >= 2) {
      score += 10;
      evidence += 1;
      reasons.push({ code: "priceAboveMovingAverages", value: aboveCount });
    } else if (belowCount >= 2) {
      score -= 10;
      evidence += 1;
      cautions.push({ code: "priceBelowMovingAverages", value: belowCount });
    }

    if (ma.crossSignal === "golden_cross") {
      score += 10;
      evidence += 1;
      reasons.push({ code: "goldenCross" });
    } else if (ma.crossSignal === "death_cross") {
      score -= 10;
      evidence += 1;
      cautions.push({ code: "deathCross" });
    }
  }

  if (input.macdSignal === "buy") {
    score += 8;
    evidence += 1;
    reasons.push({ code: "macdBuy" });
  } else if (input.macdSignal === "sell") {
    score -= 8;
    evidence += 1;
    cautions.push({ code: "macdSell" });
  }

  if (input.rsiSignal === "oversold") {
    score += 4;
    evidence += 1;
    reasons.push({ code: "rsiOversold" });
  } else if (input.rsiSignal === "overbought") {
    score -= 4;
    evidence += 1;
    cautions.push({ code: "rsiOverbought" });
  }

  if (typeof input.momentumScore === "number" && Number.isFinite(input.momentumScore)) {
    evidence += 1;
    if (input.momentumScore >= 1) {
      score += input.macdSignal === "sell" ? -5 : 5;
      (input.macdSignal === "sell" ? cautions : reasons).push({ code: "momentumStrong" });
    }
  }

  if (
    typeof input.volume === "number" && Number.isFinite(input.volume) &&
    typeof input.averageVolume === "number" && Number.isFinite(input.averageVolume) && input.averageVolume > 0
  ) {
    evidence += 1;
    const ratio = input.volume / input.averageVolume;
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

  const supportDistance = nearestDistancePercent(input.latestPrice, input.supports ?? []);
  const resistanceDistance = nearestDistancePercent(input.latestPrice, input.resistances ?? []);
  if (supportDistance != null && supportDistance <= 2) {
    evidence += 1;
    reasons.push({ code: "nearSupport" });
  }
  if (resistanceDistance != null && resistanceDistance <= 2) {
    evidence += 1;
    score -= 3;
    cautions.push({ code: "nearResistance" });
  }

  const normalizedScore = Math.round(clamp(score, 0, 100));
  const stance = normalizedScore >= 62 ? "bullish" : normalizedScore <= 38 ? "bearish" : "neutral";
  const confidence = evidence >= 6 ? "high" : evidence >= 3 ? "medium" : "low";

  return { score: normalizedScore, stance, confidence, reasons: reasons.slice(0, 5), cautions: cautions.slice(0, 5) };
}
