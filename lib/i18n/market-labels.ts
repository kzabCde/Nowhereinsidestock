import type { Locale } from "./config";
import type { MarketInsight } from "@/lib/types/market";

export function trendLabel(locale: Locale, trend: MarketInsight["trend"] | "uptrend" | "downtrend" | "sideway"): string {
  const bullish = trend === "bullish" || trend === "uptrend";
  const bearish = trend === "bearish" || trend === "downtrend";
  if (locale === "th") return bullish ? "ขาขึ้น" : bearish ? "ขาลง" : "ไซด์เวย์";
  return bullish ? "Bullish" : bearish ? "Bearish" : trend === "neutral" ? "Neutral" : "Sideway";
}

export function momentumLabel(locale: Locale, value: MarketInsight["momentum"]): string {
  if (locale === "th") return value === "strong" ? "แข็งแรง" : value === "moderate" ? "ปานกลาง" : "อ่อน";
  return value === "strong" ? "Strong" : value === "moderate" ? "Moderate" : "Weak";
}

export function rsiLabel(locale: Locale, value: MarketInsight["rsiSignal"] | string | undefined): string {
  if (!value) return "—";
  if (locale === "th") return value === "overbought" ? "ซื้อมากเกินไป" : value === "oversold" ? "ขายมากเกินไป" : value === "neutral" ? "เป็นกลาง" : value;
  return value === "overbought" ? "Overbought" : value === "oversold" ? "Oversold" : value === "neutral" ? "Neutral" : value;
}

export function macdLabel(locale: Locale, value: MarketInsight["macdSignal"] | string | undefined): string {
  if (!value) return "—";
  if (locale === "th") return value === "buy" ? "เชิงบวก" : value === "sell" ? "เชิงลบ" : value === "neutral" ? "เป็นกลาง" : value;
  return value === "buy" ? "Buy signal" : value === "sell" ? "Sell signal" : value === "neutral" ? "Neutral" : value;
}
