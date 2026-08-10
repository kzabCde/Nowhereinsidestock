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

export type SignalScoreResult = {
  score: number;
  stance: "bullish" | "neutral" | "bearish";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  cautions: string[];
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
  const reasons: string[] = [];
  const cautions: string[] = [];

  if (input.trend === "uptrend") {
    score += 14;
    evidence += 1;
    reasons.push("Primary trend is bullish");
  } else if (input.trend === "downtrend") {
    score -= 14;
    evidence += 1;
    cautions.push("Primary trend is bearish");
  }

  const ma = input.movingAverages;
  if (ma) {
    const aboveCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "above").length;
    const belowCount = [ma.priceVsMA20, ma.priceVsMA50, ma.priceVsMA200].filter((status) => status === "below").length;
    if (aboveCount >= 2) {
      score += 10;
      evidence += 1;
      reasons.push(`Price is above ${aboveCount} key moving averages`);
    } else if (belowCount >= 2) {
      score -= 10;
      evidence += 1;
      cautions.push(`Price is below ${belowCount} key moving averages`);
    }

    if (ma.crossSignal === "golden_cross") {
      score += 10;
      evidence += 1;
      reasons.push("MA50 crossed above MA200 (Golden Cross)");
    } else if (ma.crossSignal === "death_cross") {
      score -= 10;
      evidence += 1;
      cautions.push("MA50 crossed below MA200 (Death Cross)");
    }
  }

  if (input.macdSignal === "buy") {
    score += 8;
    evidence += 1;
    reasons.push("MACD is above its signal line");
  } else if (input.macdSignal === "sell") {
    score -= 8;
    evidence += 1;
    cautions.push("MACD is below its signal line");
  }

  if (input.rsiSignal === "oversold") {
    score += 4;
    evidence += 1;
    reasons.push("RSI is oversold; reversal potential is elevated");
  } else if (input.rsiSignal === "overbought") {
    score -= 4;
    evidence += 1;
    cautions.push("RSI is overbought; pullback risk is elevated");
  }

  if (typeof input.momentumScore === "number" && Number.isFinite(input.momentumScore)) {
    evidence += 1;
    if (input.momentumScore >= 1) {
      score += input.macdSignal === "sell" ? -5 : 5;
      (input.macdSignal === "sell" ? cautions : reasons).push("Normalized momentum is strong relative to price");
    }
  }

  if (
    typeof input.volume === "number" &&
    Number.isFinite(input.volume) &&
    typeof input.averageVolume === "number" &&
    Number.isFinite(input.averageVolume) &&
    input.averageVolume > 0
  ) {
    evidence += 1;
    const ratio = input.volume / input.averageVolume;
    if (ratio >= 1.5) {
      if (input.trend === "downtrend" || input.macdSignal === "sell") {
        score -= 5;
        cautions.push(`Volume is ${ratio.toFixed(1)}× average while signals are weak`);
      } else {
        score += 5;
        reasons.push(`Volume is ${ratio.toFixed(1)}× average, confirming participation`);
      }
    }
  }

  const supportDistance = nearestDistancePercent(input.latestPrice, input.supports ?? []);
  const resistanceDistance = nearestDistancePercent(input.latestPrice, input.resistances ?? []);
  if (supportDistance != null && supportDistance <= 2) {
    evidence += 1;
    reasons.push("Price is within 2% of a detected support zone");
  }
  if (resistanceDistance != null && resistanceDistance <= 2) {
    evidence += 1;
    score -= 3;
    cautions.push("Price is within 2% of a detected resistance zone");
  }

  const normalizedScore = Math.round(clamp(score, 0, 100));
  const stance = normalizedScore >= 62 ? "bullish" : normalizedScore <= 38 ? "bearish" : "neutral";
  const confidence = evidence >= 6 ? "high" : evidence >= 3 ? "medium" : "low";

  return {
    score: normalizedScore,
    stance,
    confidence,
    reasons: reasons.slice(0, 5),
    cautions: cautions.slice(0, 5)
  };
}
