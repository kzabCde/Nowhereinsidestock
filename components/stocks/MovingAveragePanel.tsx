"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import type { MovingAverages, MovingAverageStatus } from "@/lib/types/market";

type AverageItem = { label: "MA20" | "MA50" | "MA200"; value: number | null; status: MovingAverageStatus };

const statusTone: Record<MovingAverageStatus, string> = {
  above: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  below: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  neutral: "border-slate-400/30 bg-slate-500/15 text-slate-200",
  insufficient: "border-amber-400/30 bg-amber-500/15 text-amber-100"
};

const crossSignalTone: Record<MovingAverages["crossSignal"], string> = {
  golden_cross: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  death_cross: "border-rose-400/40 bg-rose-500/20 text-rose-100",
  none: "border-slate-400/30 bg-slate-500/15 text-slate-200",
  insufficient: "border-amber-400/30 bg-amber-500/15 text-amber-100"
};

export function MovingAveragePanel({ movingAverages }: { movingAverages: MovingAverages }) {
  const { locale } = useI18n();
  const th = locale === "th";
  const statusLabel: Record<MovingAverageStatus, string> = {
    above: th ? "ราคาอยู่เหนือเส้นค่าเฉลี่ย" : "Price above average",
    below: th ? "ราคาอยู่ต่ำกว่าเส้นค่าเฉลี่ย" : "Price below average",
    neutral: th ? "ราคาใกล้เส้นค่าเฉลี่ย" : "Price near average",
    insufficient: th ? "ข้อมูลยังไม่เพียงพอ" : "Insufficient data"
  };
  const crossSignalLabel: Record<MovingAverages["crossSignal"], string> = {
    golden_cross: "Golden Cross",
    death_cross: "Death Cross",
    none: th ? "ยังไม่พบ Cross ล่าสุด" : "No recent cross",
    insufficient: th ? "ข้อมูลยังไม่เพียงพอ" : "Insufficient data"
  };
  const items: AverageItem[] = [
    { label: "MA20", value: movingAverages.ma20, status: movingAverages.priceVsMA20 },
    { label: "MA50", value: movingAverages.ma50, status: movingAverages.priceVsMA50 },
    { label: "MA200", value: movingAverages.ma200, status: movingAverages.priceVsMA200 }
  ];

  const formatAverage = (value: number | null) => value == null ? (th ? "ข้อมูลยังไม่เพียงพอ" : "Insufficient data") : value.toFixed(2);
  const getExplanation = (item: AverageItem) => {
    if (item.status === "insufficient") return th ? `${item.label} ยังคำนวณไม่ได้ เพราะข้อมูลย้อนหลังยังไม่ครบตามช่วงที่ต้องใช้` : `${item.label} cannot be calculated because the required history is not available yet.`;
    if (item.status === "neutral") return th ? `ราคาปัจจุบันอยู่ใกล้ ${item.label} ควรติดตามทิศทางต่อเนื่อง` : `Current price is near ${item.label}; watch for directional confirmation.`;
    const horizon = item.label === "MA20" ? (th ? "ระยะสั้น" : "short-term") : item.label === "MA50" ? (th ? "ระยะกลาง" : "medium-term") : (th ? "ระยะยาว" : "long-term");
    if (item.status === "above") return th ? `ราคาปัจจุบันอยู่เหนือ ${item.label} สนับสนุนภาพแนวโน้ม${horizon}` : `Current price is above ${item.label}, supporting the ${horizon} trend.`;
    return th ? `ราคาปัจจุบันต่ำกว่า ${item.label} สะท้อนแรงกดดันต่อแนวโน้ม${horizon}` : `Current price is below ${item.label}, indicating pressure on the ${horizon} trend.`;
  };
  const getCrossExplanation = (crossSignal: MovingAverages["crossSignal"]) => {
    if (crossSignal === "golden_cross") return th ? "Golden Cross คือ MA50 ตัดขึ้นเหนือ MA200 ควรติดตามความต่อเนื่องของแนวโน้ม" : "Golden Cross means MA50 crossed above MA200; watch whether the trend persists.";
    if (crossSignal === "death_cross") return th ? "Death Cross คือ MA50 ตัดลงต่ำกว่า MA200 ควรติดตามแรงกดดันของแนวโน้ม" : "Death Cross means MA50 crossed below MA200; watch for continued downside pressure.";
    if (crossSignal === "insufficient") return th ? "ยังประเมิน Cross ไม่ได้ เพราะข้อมูล MA50 และ MA200 ไม่เพียงพอ" : "Cross analysis is unavailable because MA50 and MA200 data are insufficient.";
    return th ? "ยังไม่พบ Golden Cross หรือ Death Cross ล่าสุดจากข้อมูลที่มี" : "No recent Golden Cross or Death Cross is detected in the available data.";
  };

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{th ? "การวิเคราะห์ทางเทคนิค" : "Technical Analysis"}</p>
          <h2 className="mt-1 text-xl font-bold text-white">{th ? "ระบบค่าเฉลี่ยเคลื่อนที่" : "Moving Average System"}</h2>
          <p className="mt-1 text-sm text-slate-300">{th ? "วิเคราะห์ตำแหน่งราคาปัจจุบันเทียบกับ MA20, MA50 และ MA200" : "Compare current price with MA20, MA50, and MA200."}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${crossSignalTone[movingAverages.crossSignal]}`}>{crossSignalLabel[movingAverages.crossSignal]}</span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-semibold text-white">{item.label}</h3><span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone[item.status]}`}>{statusLabel[item.status]}</span></div>
            <p className="mt-3 text-2xl font-bold text-white">{formatAverage(item.value)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{getExplanation(item)}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-semibold ${crossSignalTone[movingAverages.crossSignal]}`}>{crossSignalLabel[movingAverages.crossSignal]}</span><p className="text-sm text-slate-300">{getCrossExplanation(movingAverages.crossSignal)}</p></div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">{th ? "สัญญาณ Moving Average อ้างอิงข้อมูลย้อนหลังและไม่รับประกันผลลัพธ์ในอนาคต" : "Moving-average signals are based on historical data and do not guarantee future outcomes."}</p>
    </section>
  );
}
