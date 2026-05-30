import { Radar } from "lucide-react";
import { buildNextSignals, getNearestResistance, getNearestSupport } from "@/lib/analysis/next-signal";
import type { MovingAverages, PriceZone } from "@/lib/types/market";

type NextSignalPanelProps = {
  symbol: string;
  latestPrice: number;
  changePercent: number;
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

const trendText: Record<NextSignalPanelProps["trend"], string> = {
  uptrend: "แนวโน้มหลักยังอยู่ในภาพบวกจากข้อมูลเทคนิคปัจจุบัน",
  downtrend: "แนวโน้มหลักยังอยู่ภายใต้แรงกดดันจากข้อมูลเทคนิคปัจจุบัน",
  sideway: "ราคาเคลื่อนไหวในกรอบและยังไม่มีทิศทางเด่นชัด"
};

const maStatusText: Record<MovingAverages["priceVsMA20"], string> = {
  above: "อยู่เหนือ",
  below: "ต่ำกว่า",
  neutral: "ใกล้เคียง",
  insufficient: "ข้อมูลไม่พอสำหรับ"
};

const toneClass: Record<"positive" | "neutral" | "negative" | "warning", string> = {
  positive: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  neutral: "border-slate-300/15 bg-white/[0.04] text-slate-100",
  negative: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  warning: "border-amber-300/25 bg-amber-400/10 text-amber-100"
};

const scenarioCards = [
  {
    title: "Bullish scenario",
    label: "ฉากทัศน์เชิงบวก",
    description: "หากราคายืนเหนือ MA20 และผ่านแนวต้านใกล้สุดได้ โมเมนตัมเชิงบวกอาจแข็งแรงขึ้น",
    className: "border-emerald-300/20 bg-emerald-400/10"
  },
  {
    title: "Neutral scenario",
    label: "ฉากทัศน์ทรงตัว",
    description: "หากราคายังแกว่งอยู่ระหว่างแนวรับและแนวต้าน อาจยังเป็นภาวะ Sideway",
    className: "border-slate-300/15 bg-white/[0.04]"
  },
  {
    title: "Bearish scenario",
    label: "ฉากทัศน์เชิงลบ",
    description: "หากราคาหลุดแนวรับสำคัญหรือต่ำกว่า MA50 ต่อเนื่อง อาจสะท้อนแรงขายที่เพิ่มขึ้น",
    className: "border-rose-300/20 bg-rose-400/10"
  }
];

function formatPrice(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatVolume(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function getMovingAverageContext(movingAverages: MovingAverages | undefined): string {
  if (!movingAverages) return "ยังไม่มีข้อมูล Moving Average เพียงพอสำหรับประเมินตำแหน่งราคา";

  const ma20Text = `${maStatusText[movingAverages.priceVsMA20]} MA20`;
  const ma50Text = `${maStatusText[movingAverages.priceVsMA50]} MA50`;
  const ma200Text = `${maStatusText[movingAverages.priceVsMA200]} MA200`;
  return `ราคาปัจจุบัน ${ma20Text}, ${ma50Text} และ ${ma200Text}`;
}

function getIndicatorContext(rsiSignal: string | undefined, macdSignal: string | undefined): string {
  const rsiText = rsiSignal ? `RSI อยู่ในสถานะ ${rsiSignal}` : "RSI ยังไม่มีข้อมูลเพียงพอ";
  const macdText = macdSignal ? `MACD อยู่ในสถานะ ${macdSignal}` : "MACD ยังไม่มีข้อมูลเพียงพอ";
  return `${rsiText} และ ${macdText}`;
}

function getVolumeContext(volume: number | null | undefined, averageVolume: number | null | undefined): string {
  if (typeof volume !== "number" || !Number.isFinite(volume)) return "ยังไม่มีข้อมูลปริมาณซื้อขายล่าสุด";
  if (typeof averageVolume !== "number" || !Number.isFinite(averageVolume) || averageVolume <= 0) {
    return `Volume ล่าสุด ${formatVolume(volume)} แต่ยังไม่มีค่าเฉลี่ยที่ใช้เทียบได้`;
  }

  if (volume > averageVolume) {
    return `Volume ล่าสุด ${formatVolume(volume)} สูงกว่าค่าเฉลี่ย ${formatVolume(averageVolume)} อาจสะท้อนความสนใจที่เพิ่มขึ้น`;
  }

  return `Volume ล่าสุด ${formatVolume(volume)} ยังไม่สูงกว่าค่าเฉลี่ย ${formatVolume(averageVolume)}`;
}

export function NextSignalPanel({
  symbol,
  latestPrice,
  changePercent,
  trend,
  movingAverages,
  supportResistance,
  rsiSignal,
  macdSignal,
  volume,
  averageVolume
}: NextSignalPanelProps) {
  const signals = buildNextSignals({ latestPrice, trend, movingAverages, supportResistance, rsiSignal, macdSignal, volume, averageVolume });
  const nearestSupport = getNearestSupport(latestPrice, supportResistance?.supports ?? []);
  const nearestResistance = getNearestResistance(latestPrice, supportResistance?.resistances ?? []);

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next Signal</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-white">
            <Radar className="text-cyan-100" size={22} />
            จุดที่ควรจับตาต่อไป
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            สรุปสัญญาณเทคนิคของ {symbol} จากข้อมูลปัจจุบัน โดยเน้นสิ่งที่ควรติดตามต่อ ไม่ใช่การคาดการณ์ผลลัพธ์ล่วงหน้า
          </p>
        </div>
        <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${changePercent >= 0 ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100" : "border-rose-300/25 bg-rose-400/10 text-rose-100"}`}>
          {formatPrice(latestPrice)} • {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current Technical Context</p>
        <h3 className="mt-1 text-lg font-semibold text-white">ภาพรวมสัญญาณตอนนี้</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          <li>{trendText[trend]}</li>
          <li>{getMovingAverageContext(movingAverages)}</li>
          <li>{getIndicatorContext(rsiSignal, macdSignal)}</li>
          <li>{getVolumeContext(volume, averageVolume)}</li>
        </ul>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-slate-400">Nearest support</p>
            <p className="mt-1 text-base font-semibold text-white">{formatPrice(nearestSupport?.level)}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs text-slate-400">Nearest resistance</p>
            <p className="mt-1 text-base font-semibold text-white">{formatPrice(nearestResistance?.level)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">What to Watch Next</p>
        <h3 className="mt-1 text-lg font-semibold text-white">จุดที่ควรจับตาต่อไป</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {signals.map((signal) => (
            <article key={`${signal.title}-${signal.description}`} className={`rounded-2xl border p-4 ${toneClass[signal.tone]}`}>
              <h4 className="text-base font-semibold text-white">{signal.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-200">{signal.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Scenario Summary</p>
        <h3 className="mt-1 text-lg font-semibold text-white">ฉากทัศน์ที่เป็นไปได้</h3>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {scenarioCards.map((scenario) => (
            <article key={scenario.title} className={`rounded-2xl border p-4 ${scenario.className}`}>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{scenario.title}</p>
              <h4 className="mt-2 text-base font-semibold text-white">{scenario.label}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{scenario.description}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">
        ข้อมูลนี้เป็นการวิเคราะห์เชิงเทคนิคจากข้อมูลย้อนหลัง ไม่ใช่การคาดการณ์ที่การันตีผลลัพธ์ และไม่ใช่คำแนะนำในการซื้อขาย
      </div>
    </section>
  );
}
