import type { MovingAverages, PriceZone } from "@/lib/types/market";

export type NextSignal = {
  title: string;
  description: string;
  tone: "positive" | "neutral" | "negative" | "warning";
};

export type NextSignalInput = {
  latestPrice: number;
  trend: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  supportResistance?: {
    supports: PriceZone[];
    resistances: PriceZone[];
  };
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
  const hasAboveAverageVolume =
    typeof data.volume === "number" &&
    typeof data.averageVolume === "number" &&
    data.averageVolume > 0 &&
    data.volume > data.averageVolume;

  if (nearestResistance && isNearLevel(data.latestPrice, nearestResistance.level)) {
    signals.push({
      title: "ใกล้แนวต้าน",
      description: "ราคากำลังเข้าใกล้แนวต้าน ควรจับตาว่าจะผ่านโซนนี้ได้หรือถูกขายกลับลงมา",
      tone: "warning"
    });
  }

  if (nearestSupport && isNearLevel(data.latestPrice, nearestSupport.level)) {
    signals.push({
      title: "ใกล้แนวรับ",
      description: "ราคากำลังเข้าใกล้แนวรับ ควรดูว่ามีแรงซื้อกลับเข้ามาหรือไม่",
      tone: "neutral"
    });
  }

  if (movingAverages?.priceVsMA20 === "above" && movingAverages.priceVsMA50 === "above") {
    signals.push({
      title: "ยืนเหนือ MA20 / MA50",
      description: "ราคายังอยู่เหนือค่าเฉลี่ยสำคัญ สะท้อนโมเมนตัมที่ยังแข็งแรงในระยะสั้นถึงกลาง",
      tone: "positive"
    });
  }

  if (movingAverages?.priceVsMA20 === "below" && movingAverages.priceVsMA50 === "below") {
    signals.push({
      title: "ต่ำกว่า MA20 / MA50",
      description: "ราคาต่ำกว่าค่าเฉลี่ยสำคัญ อาจสะท้อนแรงกดดันหรือโมเมนตัมที่อ่อนตัว",
      tone: "negative"
    });
  }

  if (rsiSignal === "overbought") {
    signals.push({
      title: "RSI ร้อนแรง",
      description: "RSI อยู่ในโซนร้อนแรง ควรระวังแรงขายทำกำไร",
      tone: "warning"
    });
  }

  if (rsiSignal === "oversold") {
    signals.push({
      title: "RSI อ่อนตัวมาก",
      description: "RSI อยู่ในโซนอ่อนตัวมาก ควรจับตาการฟื้นตัวหรือแรงซื้อกลับ",
      tone: "neutral"
    });
  }

  if (hasAboveAverageVolume) {
    signals.push({
      title: "Volume สูงกว่าค่าเฉลี่ย",
      description: "ปริมาณซื้อขายสูงกว่าปกติ อาจสะท้อนความสนใจของตลาดที่เพิ่มขึ้น",
      tone: "neutral"
    });
  }

  if (macdSignal === "buy") {
    signals.push({
      title: "MACD เป็นบวก",
      description: "MACD อยู่ฝั่งบวกเมื่อเทียบกับเส้นสัญญาณ ควรจับตาความต่อเนื่องร่วมกับราคาและปริมาณซื้อขาย",
      tone: "positive"
    });
  }

  if (macdSignal === "sell") {
    signals.push({
      title: "MACD อ่อนแรง",
      description: "MACD ต่ำกว่าเส้นสัญญาณ อาจสะท้อนแรงกดดันระยะสั้นที่ควรระวัง",
      tone: "negative"
    });
  }

  if (signals.length === 0) {
    signals.push({
      title: "รอข้อมูลยืนยันเพิ่ม",
      description: "สัญญาณหลักยังไม่เด่นชัด ควรจับตาราคาเทียบกับค่าเฉลี่ย แนวรับ แนวต้าน และปริมาณซื้อขายในข้อมูลถัดไป",
      tone: data.trend === "uptrend" ? "positive" : data.trend === "downtrend" ? "negative" : "neutral"
    });
  }

  return signals;
}
