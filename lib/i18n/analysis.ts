import type { Locale } from "./config";
import { macdLabel, rsiLabel } from "./market-labels";
import type { NextSignalCode } from "@/lib/analysis/next-signal";
import type { SignalEvidence } from "@/lib/analysis/signal-score";
import type { MovingAverages } from "@/lib/types/market";

const nextSignalMessages: Record<Locale, Record<NextSignalCode, { title: string; description: string }>> = {
  en: {
    nearResistance: { title: "Near resistance", description: "Price is approaching a detected resistance zone. Watch whether it can break through or gets rejected." },
    nearSupport: { title: "Near support", description: "Price is approaching a detected support zone. Watch for stabilization or renewed buying interest." },
    aboveKeyMovingAverages: { title: "Above MA20 / MA50", description: "Price remains above key moving averages, supporting short-to-medium-term momentum." },
    belowKeyMovingAverages: { title: "Below MA20 / MA50", description: "Price is below key moving averages, which can indicate weaker momentum or selling pressure." },
    rsiOverbought: { title: "RSI is elevated", description: "RSI is in an overbought zone. Watch for profit-taking or momentum cooling." },
    rsiOversold: { title: "RSI is oversold", description: "RSI is deeply weak. Watch for stabilization or a possible recovery attempt." },
    volumeAboveAverage: { title: "Volume above average", description: "Trading volume is above its recent average, indicating elevated market participation." },
    macdPositive: { title: "MACD positive", description: "MACD is above its signal line. Watch whether price and volume confirm the momentum." },
    macdWeak: { title: "MACD weakening", description: "MACD is below its signal line, which can reflect short-term downside pressure." },
    waitForConfirmation: { title: "Wait for more confirmation", description: "No dominant signal is present. Watch price relative to moving averages, support, resistance, and volume." }
  },
  th: {
    nearResistance: { title: "ใกล้แนวต้าน", description: "ราคากำลังเข้าใกล้แนวต้านที่ตรวจพบ ควรจับตาว่าจะผ่านโซนนี้ได้หรือถูกขายกลับลงมา" },
    nearSupport: { title: "ใกล้แนวรับ", description: "ราคากำลังเข้าใกล้แนวรับที่ตรวจพบ ควรดูว่าราคาเริ่มทรงตัวหรือมีแรงซื้อกลับเข้ามาหรือไม่" },
    aboveKeyMovingAverages: { title: "ยืนเหนือ MA20 / MA50", description: "ราคายังอยู่เหนือค่าเฉลี่ยสำคัญ สนับสนุนภาพโมเมนตัมระยะสั้นถึงกลาง" },
    belowKeyMovingAverages: { title: "ต่ำกว่า MA20 / MA50", description: "ราคาต่ำกว่าค่าเฉลี่ยสำคัญ อาจสะท้อนโมเมนตัมที่อ่อนตัวหรือแรงขายกดดัน" },
    rsiOverbought: { title: "RSI อยู่ในระดับสูง", description: "RSI อยู่ในโซน Overbought ควรระวังแรงขายทำกำไรหรือโมเมนตัมที่เริ่มลดลง" },
    rsiOversold: { title: "RSI อยู่ในระดับต่ำ", description: "RSI อยู่ในโซน Oversold ควรจับตาการทรงตัวหรือความพยายามฟื้นตัวของราคา" },
    volumeAboveAverage: { title: "Volume สูงกว่าค่าเฉลี่ย", description: "ปริมาณซื้อขายสูงกว่าค่าเฉลี่ยล่าสุด สะท้อนการมีส่วนร่วมของตลาดที่เพิ่มขึ้น" },
    macdPositive: { title: "MACD เป็นบวก", description: "MACD อยู่เหนือเส้นสัญญาณ ควรดูว่าราคาและปริมาณซื้อขายยืนยันโมเมนตัมต่อหรือไม่" },
    macdWeak: { title: "MACD อ่อนแรง", description: "MACD ต่ำกว่าเส้นสัญญาณ อาจสะท้อนแรงกดดันระยะสั้นที่ควรระวัง" },
    waitForConfirmation: { title: "รอข้อมูลยืนยันเพิ่ม", description: "ยังไม่มีสัญญาณหลักที่เด่นชัด ควรติดตามราคาเทียบกับค่าเฉลี่ย แนวรับ แนวต้าน และปริมาณซื้อขาย" }
  }
};

export function translateNextSignal(locale: Locale, code: NextSignalCode) {
  return nextSignalMessages[locale][code];
}

export function translateEvidence(locale: Locale, evidence: SignalEvidence): string {
  const value = evidence.value;
  const en: Record<SignalEvidence["code"], string> = {
    trendBullish: "Primary trend is bullish",
    trendBearish: "Primary trend is bearish",
    priceAboveMovingAverages: `Price is above ${value ?? 0} key moving averages`,
    priceBelowMovingAverages: `Price is below ${value ?? 0} key moving averages`,
    goldenCross: "MA50 crossed above MA200 (Golden Cross)",
    deathCross: "MA50 crossed below MA200 (Death Cross)",
    macdBuy: "MACD is above its signal line",
    macdSell: "MACD is below its signal line",
    rsiOversold: "RSI is oversold; reversal potential is elevated",
    rsiOverbought: "RSI is overbought; pullback risk is elevated",
    momentumStrong: "Normalized momentum is strong relative to price",
    volumeWeak: `Volume is ${(value ?? 0).toFixed(1)}× average while signals are weak`,
    volumeConfirm: `Volume is ${(value ?? 0).toFixed(1)}× average, confirming participation`,
    nearSupport: "Price is within 2% of a detected support zone",
    nearResistance: "Price is within 2% of a detected resistance zone"
  };
  const th: Record<SignalEvidence["code"], string> = {
    trendBullish: "แนวโน้มหลักเป็นขาขึ้น",
    trendBearish: "แนวโน้มหลักเป็นขาลง",
    priceAboveMovingAverages: `ราคาอยู่เหนือเส้นค่าเฉลี่ยสำคัญ ${value ?? 0} เส้น`,
    priceBelowMovingAverages: `ราคาอยู่ต่ำกว่าเส้นค่าเฉลี่ยสำคัญ ${value ?? 0} เส้น`,
    goldenCross: "MA50 ตัดขึ้นเหนือ MA200 (Golden Cross)",
    deathCross: "MA50 ตัดลงต่ำกว่า MA200 (Death Cross)",
    macdBuy: "MACD อยู่เหนือเส้นสัญญาณ",
    macdSell: "MACD อยู่ต่ำกว่าเส้นสัญญาณ",
    rsiOversold: "RSI อยู่ในโซน Oversold และมีโอกาสเกิดการฟื้นตัวมากขึ้น",
    rsiOverbought: "RSI อยู่ในโซน Overbought และมีความเสี่ยงต่อการย่อตัวมากขึ้น",
    momentumStrong: "โมเมนตัมแบบปรับฐานราคายังแข็งแรง",
    volumeWeak: `Volume อยู่ที่ ${(value ?? 0).toFixed(1)}× ของค่าเฉลี่ย ขณะที่สัญญาณยังอ่อนแรง`,
    volumeConfirm: `Volume อยู่ที่ ${(value ?? 0).toFixed(1)}× ของค่าเฉลี่ย ช่วยยืนยันการมีส่วนร่วมของตลาด`,
    nearSupport: "ราคาอยู่ห่างจากแนวรับที่ตรวจพบไม่เกิน 2%",
    nearResistance: "ราคาอยู่ห่างจากแนวต้านที่ตรวจพบไม่เกิน 2%"
  };
  return (locale === "th" ? th : en)[evidence.code];
}

export function translateTrendContext(locale: Locale, trend: "uptrend" | "downtrend" | "sideway"): string {
  const text = {
    en: { uptrend: "The primary technical trend remains constructive.", downtrend: "The primary technical trend remains under pressure.", sideway: "Price is moving sideways without a dominant directional trend." },
    th: { uptrend: "แนวโน้มทางเทคนิคหลักยังอยู่ในภาพเชิงบวก", downtrend: "แนวโน้มทางเทคนิคหลักยังอยู่ภายใต้แรงกดดัน", sideway: "ราคาเคลื่อนไหวในกรอบและยังไม่มีทิศทางเด่นชัด" }
  } as const;
  return text[locale][trend];
}

export function translateMovingAverageContext(locale: Locale, movingAverages?: MovingAverages): string {
  if (!movingAverages) return locale === "th" ? "ยังไม่มีข้อมูล Moving Average เพียงพอสำหรับประเมินตำแหน่งราคา" : "There is not enough moving-average data to evaluate price position.";
  const status = {
    en: { above: "above", below: "below", neutral: "near", insufficient: "without enough data for" },
    th: { above: "อยู่เหนือ", below: "ต่ำกว่า", neutral: "ใกล้เคียง", insufficient: "ข้อมูลไม่พอสำหรับ" }
  } as const;
  const map = status[locale];
  return locale === "th"
    ? `ราคาปัจจุบัน ${map[movingAverages.priceVsMA20]} MA20, ${map[movingAverages.priceVsMA50]} MA50 และ ${map[movingAverages.priceVsMA200]} MA200`
    : `Current price is ${map[movingAverages.priceVsMA20]} MA20, ${map[movingAverages.priceVsMA50]} MA50, and ${map[movingAverages.priceVsMA200]} MA200.`;
}

export function translateIndicatorContext(locale: Locale, rsiSignal?: string, macdSignal?: string): string {
  const rsi = rsiLabel(locale, rsiSignal);
  const macd = macdLabel(locale, macdSignal);
  return locale === "th" ? `RSI: ${rsi} และ MACD: ${macd}` : `RSI: ${rsi}; MACD: ${macd}.`;
}

export function translateVolumeContext(locale: Locale, volume: number | null | undefined, averageVolume: number | null | undefined): string {
  const formatter = new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", { notation: "compact", maximumFractionDigits: 1 });
  if (typeof volume !== "number" || !Number.isFinite(volume)) return locale === "th" ? "ยังไม่มีข้อมูลปริมาณซื้อขายล่าสุด" : "Latest volume is unavailable.";
  if (typeof averageVolume !== "number" || !Number.isFinite(averageVolume) || averageVolume <= 0) return locale === "th" ? `Volume ล่าสุด ${formatter.format(volume)} แต่ยังไม่มีค่าเฉลี่ยที่ใช้เทียบได้` : `Latest volume is ${formatter.format(volume)}, but a comparable average is unavailable.`;
  const ratio = volume / averageVolume;
  return locale === "th" ? `Volume ล่าสุด ${formatter.format(volume)} เท่ากับ ${ratio.toFixed(2)}× ของค่าเฉลี่ย ${formatter.format(averageVolume)}` : `Latest volume is ${formatter.format(volume)}, or ${ratio.toFixed(2)}× the average of ${formatter.format(averageVolume)}.`;
}
