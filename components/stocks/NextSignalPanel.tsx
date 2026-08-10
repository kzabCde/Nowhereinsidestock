import { Radar } from "lucide-react";
import { buildNextSignals, getNearestResistance, getNearestSupport } from "@/lib/analysis/next-signal";
import { buildSignalScore } from "@/lib/analysis/signal-score";
import { formatMarketCurrency } from "@/lib/format/market";
import type { MovingAverages, PriceZone } from "@/lib/types/market";

type NextSignalPanelProps = {
  symbol: string;
  latestPrice: number;
  currency?: string;
  changePercent: number;
  trend: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  supportResistance?: { supports: PriceZone[]; resistances: PriceZone[] };
  rsiSignal?: string;
  macdSignal?: string;
  momentumScore?: number;
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

function formatVolume(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function getMovingAverageContext(movingAverages: MovingAverages | undefined): string {
  if (!movingAverages) return "ยังไม่มีข้อมูล Moving Average เพียงพอสำหรับประเมินตำแหน่งราคา";
  return `ราคาปัจจุบัน ${maStatusText[movingAverages.priceVsMA20]} MA20, ${maStatusText[movingAverages.priceVsMA50]} MA50 และ ${maStatusText[movingAverages.priceVsMA200]} MA200`;
}

function getIndicatorContext(rsiSignal: string | undefined, macdSignal: string | undefined): string {
  const rsiText = rsiSignal ? `RSI อยู่ในสถานะ ${rsiSignal}` : "RSI ยังไม่มีข้อมูลเพียงพอ";
  const macdText = macdSignal ? `MACD อยู่ในสถานะ ${macdSignal}` : "MACD ยังไม่มีข้อมูลเพียงพอ";
  return `${rsiText} และ ${macdText}`;
}

function getVolumeContext(volume: number | null | undefined, averageVolume: number | null | undefined): string {
  if (typeof volume !== "number" || !Number.isFinite(volume)) return "ยังไม่มีข้อมูลปริมาณซื้อขายล่าสุด";
  if (typeof averageVolume !== "number" || !Number.isFinite(averageVolume) || averageVolume <= 0) return `Volume ล่าสุด ${formatVolume(volume)} แต่ยังไม่มีค่าเฉลี่ยที่ใช้เทียบได้`;
  const ratio = volume / averageVolume;
  return `Volume ล่าสุด ${formatVolume(volume)} เท่ากับ ${ratio.toFixed(2)}× ของค่าเฉลี่ย ${formatVolume(averageVolume)}`;
}

export function NextSignalPanel({
  symbol,
  latestPrice,
  currency = "USD",
  changePercent,
  trend,
  movingAverages,
  supportResistance,
  rsiSignal,
  macdSignal,
  momentumScore,
  volume,
  averageVolume
}: NextSignalPanelProps) {
  const supports = supportResistance?.supports ?? [];
  const resistances = supportResistance?.resistances ?? [];
  const signals = buildNextSignals({ latestPrice, trend, movingAverages, supportResistance, rsiSignal, macdSignal, volume, averageVolume });
  const score = buildSignalScore({ latestPrice, trend, movingAverages, rsiSignal, macdSignal, momentumScore, volume, averageVolume, supports, resistances });
  const nearestSupport = getNearestSupport(latestPrice, supports);
  const nearestResistance = getNearestResistance(latestPrice, resistances);
  const scoreTone = score.stance === "bullish" ? "text-success" : score.stance === "bearish" ? "text-danger" : "text-warning";

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explainable Signal Score</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-white"><Radar className="text-cyan-100" size={22} /> จุดที่ควรจับตาต่อไป</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">คะแนนนี้รวม trend, moving averages, MACD, RSI, normalized momentum, volume และตำแหน่งใกล้ support/resistance โดยแสดงเหตุผลประกอบ ไม่ใช่คำสั่งซื้อขาย</p>
        </div>
        <span className={`w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold ${changePercent >= 0 ? "text-success" : "text-danger"}`}>{formatMarketCurrency(latestPrice, currency)} • {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-2xl border border-white/10 bg-elevated p-4">
          <p className="section-kicker">Technical score</p>
          <p className={`mt-2 text-5xl font-black tabular-nums ${scoreTone}`}>{score.score}<span className="text-lg text-slate-600">/100</span></p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{score.stance.toUpperCase()}</span><span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{score.confidence} evidence confidence</span></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4"><p className="section-kicker">Supporting evidence</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-300">{score.reasons.length > 0 ? score.reasons.map((reason) => <li key={reason}>+ {reason}</li>) : <li>No strong positive evidence yet.</li>}</ul></div>
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4"><p className="section-kicker">Cautions</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-300">{score.cautions.length > 0 ? score.cautions.map((caution) => <li key={caution}>− {caution}</li>) : <li>No major technical caution detected.</li>}</ul></div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="section-kicker">Current context</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300"><li>{trendText[trend]}</li><li>{getMovingAverageContext(movingAverages)}</li><li>{getIndicatorContext(rsiSignal, macdSignal)}</li><li>{getVolumeContext(volume, averageVolume)}</li></ul>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">Nearest support</p><p className="mt-1 text-base font-semibold text-white">{formatMarketCurrency(nearestSupport?.level, currency)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">Nearest resistance</p><p className="mt-1 text-base font-semibold text-white">{formatMarketCurrency(nearestResistance?.level, currency)}</p></div>
        </div>
      </div>

      <div className="mt-5"><p className="section-kicker">What to watch next</p><div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">{signals.map((signal) => <article key={`${signal.title}-${signal.description}`} className={`rounded-2xl border p-4 ${toneClass[signal.tone]}`}><h4 className="text-base font-semibold text-white">{signal.title}</h4><p className="mt-2 text-sm leading-6 text-slate-200">{signal.description}</p></article>)}</div></div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">Signal Score และ Backtest ใช้ข้อมูลย้อนหลังและกฎเชิงเทคนิคที่กำหนดไว้อย่างโปร่งใส ไม่ใช่โมเดลที่รับประกันผลตอบแทน และไม่ใช่คำแนะนำการลงทุน</div>
    </section>
  );
}
