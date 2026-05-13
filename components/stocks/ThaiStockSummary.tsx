import { useMemo } from "react";

export type ThaiStockSummaryProps = {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  latestPrice: number;
  changePercent: number;
  trend: "uptrend" | "downtrend" | "sideway";
  momentum?: string;
  rsiSignal?: string;
  macdSignal?: string;
  volatility?: number;
};

const trendThaiMap: Record<ThaiStockSummaryProps["trend"], string> = {
  uptrend: "แนวโน้มขาขึ้น",
  downtrend: "แนวโน้มอ่อนตัวและมีแรงขายกดดัน",
  sideway: "แกว่งตัวในกรอบโดยยังไม่มีทิศทางชัดเจน"
};

const rsiMap: Record<string, string> = {
  overbought: "RSI อยู่ในโซนค่อนข้างร้อนแรง อาจสะท้อนแรงซื้อที่มากในช่วงสั้น",
  oversold: "RSI อยู่ในโซนที่อ่อนตัว อาจสะท้อนแรงขายที่เร่งตัวก่อนหน้า",
  neutral: "RSI อยู่ระดับกลาง สะท้อนสมดุลระหว่างแรงซื้อและแรงขาย"
};

const macdMap: Record<string, string> = {
  buy: "MACD เริ่มส่งสัญญาณเชิงบวก มีแนวโน้มว่ากระแสราคาอาจดีขึ้น",
  sell: "MACD ส่งสัญญาณอ่อนแรง เป็นสัญญาณที่ควรระวังแรงขายระยะสั้น",
  neutral: "MACD ยังไม่ชี้ทิศทางเด่นชัด ควรติดตามร่วมกับราคา"
};

export function ThaiStockSummary({
  symbol,
  name,
  sector,
  industry,
  latestPrice,
  changePercent,
  trend,
  momentum,
  rsiSignal,
  macdSignal,
  volatility
}: ThaiStockSummaryProps) {
  const displayName = name?.trim() ? name : symbol;

  const movementText = changePercent >= 0
    ? `ราคาปรับขึ้น ${changePercent.toFixed(2)}% เมื่อเทียบกับช่วงที่เลือก`
    : `ราคาปรับลง ${Math.abs(changePercent).toFixed(2)}% เมื่อเทียบกับช่วงที่เลือก`;

  const trendSummary = useMemo(() => {
    return `หุ้น ${displayName} (${symbol}) ปัจจุบันมีการเปลี่ยนแปลงราคา ${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}% โดยระบบประเมินว่าอยู่ในภาวะ${trendThaiMap[trend]} ซึ่งอาจสะท้อนแรงซื้อหรือแรงขายในระยะสั้น`;
  }, [changePercent, displayName, symbol, trend]);

  const momentumText = momentum
    ? `โมเมนตัม: ${momentum} (ใช้ดูความต่อเนื่องของแรงราคา)`
    : "โมเมนตัม: ยังไม่มีข้อมูลเพียงพอสำหรับสัญญาณนี้";

  const rsiText = rsiSignal
    ? (rsiMap[rsiSignal.toLowerCase()] ?? `RSI: ${rsiSignal} ควรติดตามร่วมกับแนวรับแนวต้าน`)
    : "RSI: ยังไม่มีข้อมูลเพียงพอสำหรับสัญญาณนี้";

  const macdText = macdSignal
    ? (macdMap[macdSignal.toLowerCase()] ?? `MACD: ${macdSignal} ควรติดตามการเปลี่ยนแปลงต่อเนื่อง`)
    : "MACD: ยังไม่มีข้อมูลเพียงพอสำหรับสัญญาณนี้";

  return (
    <section className="printstream-shell pearl-border w-full rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-white sm:text-xl">Thai Stock Summary Panel</h2>

      <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-200 sm:text-base">
        <div>
          <h3 className="font-semibold text-white">ภาพรวมบริษัท</h3>
          <p>หุ้น {displayName} ({symbol}) ราคาล่าสุด ${latestPrice.toFixed(2)} และ{movementText}.</p>
          {(sector || industry) && (
            <p className="text-slate-300">
              {sector && <span>Sector: {sector}</span>}
              {sector && industry && <span> • </span>}
              {industry && <span>Industry: {industry}</span>}
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-white">สรุปแนวโน้มราคา</h3>
          <p>{trendSummary}</p>
        </div>

        <div>
          <h3 className="font-semibold text-white">สัญญาณที่ควรจับตา</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>{momentumText}</li>
            <li>{rsiText}</li>
            <li>{macdText}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-white">ข้อควรระวัง</h3>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            <li>ความผันผวน{typeof volatility === "number" ? `ประมาณ ${volatility}%` : "ยังไม่มีข้อมูลเพียงพอสำหรับสัญญาณนี้"} อาจทำให้ราคาแกว่งแรงกว่าปกติ</li>
            <li>สัญญาณทางเทคนิคเป็นเพียงส่วนหนึ่ง ควรติดตามข่าวและปัจจัยพื้นฐานเพิ่มเติม</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-3">
          <h3 className="font-semibold text-white">หมายเหตุ</h3>
          <p className="text-slate-300">ข้อมูลนี้จัดทำเพื่อการศึกษาและการติดตามภาพรวมเท่านั้น ไม่ใช่คำแนะนำในการลงทุน</p>
        </div>
      </div>
    </section>
  );
}
