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
  uptrend: "ราคาเอนเอียงไปทางขาขึ้นในระยะสั้น",
  downtrend: "ราคายังอ่อนตัวและมีแรงขายกดดัน",
  sideway: "ราคาแกว่งตัวในกรอบ ยังไม่มีทิศทางเด่นชัด"
};

const rsiMap: Record<string, string> = {
  overbought: "RSI ค่อนข้างร้อนแรง ควรสังเกตว่าราคาเริ่มพักตัวหรือไม่",
  oversold: "RSI อ่อนตัวมาก ควรดูว่าราคาเริ่มหยุดลงหรือยัง",
  neutral: "RSI อยู่ระดับกลาง แรงซื้อและแรงขายใกล้เคียงกัน"
};

const macdMap: Record<string, string> = {
  buy: "MACD เริ่มเป็นบวก ใช้ดูแรงส่งของราคาเพิ่มเติม",
  sell: "MACD อ่อนแรง ควรติดตามความเสี่ยงจากแรงขายระยะสั้น",
  neutral: "MACD ยังไม่ชี้ทิศทางชัด ควรดูร่วมกับกราฟราคา"
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
    ? `ปรับขึ้น ${changePercent.toFixed(2)}%`
    : `ปรับลง ${Math.abs(changePercent).toFixed(2)}%`;

  const overviewText = useMemo(() => {
    return `หุ้น ${displayName} (${symbol}) ราคาล่าสุดอยู่ที่ $${latestPrice.toFixed(2)} และ${movementText} จากข้อมูลล่าสุด`;
  }, [displayName, latestPrice, movementText, symbol]);

  const momentumText = momentum
    ? `โมเมนตัมอยู่ระดับ ${momentum} ใช้ดูความต่อเนื่องของแรงราคา`
    : "ยังไม่มีข้อมูลโมเมนตัมเพียงพอ";

  const rsiText = rsiSignal
    ? (rsiMap[rsiSignal.toLowerCase()] ?? `RSI: ${rsiSignal} ควรอ่านร่วมกับแนวรับและแนวต้าน`)
    : "ยังไม่มีข้อมูล RSI เพียงพอ";

  const macdText = macdSignal
    ? (macdMap[macdSignal.toLowerCase()] ?? `MACD: ${macdSignal} ควรติดตามการเปลี่ยนแปลงต่อเนื่อง`)
    : "ยังไม่มีข้อมูล MACD เพียงพอ";

  return (
    <section className="printstream-shell pearl-border w-full rounded-3xl border border-white/10 bg-black/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Thai Summary</p>
          <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">สรุปหุ้นแบบอ่านง่าย</h2>
        </div>
        {(sector || industry) && (
          <p className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-300">
            {[sector, industry].filter(Boolean).join(" • ")}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 text-sm leading-relaxed text-slate-200 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="font-semibold text-white">ภาพรวม</h3>
          <p className="mt-1">{overviewText}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="font-semibold text-white">แนวโน้มราคา</h3>
          <p className="mt-1">{trendThaiMap[trend]}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="font-semibold text-white">สัญญาณที่ควรจับตา</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>{momentumText}</li>
            <li>{rsiText}</li>
            <li>{macdText}</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <h3 className="font-semibold text-white">มูลค่าประเมินและความเสี่ยง</h3>
          <p className="mt-1">
            ใช้เครื่องคำนวณมูลค่ายุติธรรมและโซนแนวรับ / แนวต้านด้านล่างประกอบการเรียนรู้ โดยความผันผวนปัจจุบัน
            {typeof volatility === "number" ? ` ประมาณ ${volatility}%` : " ยังมีข้อมูลไม่เพียงพอ"}
          </p>
          <p className="mt-2 text-slate-300">ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำซื้อหรือขาย</p>
        </div>
      </div>
    </section>
  );
}
