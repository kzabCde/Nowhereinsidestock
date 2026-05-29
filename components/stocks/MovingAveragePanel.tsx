import type { MovingAverages, MovingAverageStatus } from "@/lib/types/market";

type MovingAveragePanelProps = {
  movingAverages: MovingAverages;
};

type AverageItem = {
  label: "MA20" | "MA50" | "MA200";
  value: number | null;
  status: MovingAverageStatus;
};

const statusTone: Record<MovingAverageStatus, string> = {
  above: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
  below: "border-rose-400/30 bg-rose-500/15 text-rose-200",
  neutral: "border-slate-400/30 bg-slate-500/15 text-slate-200",
  insufficient: "border-amber-400/30 bg-amber-500/15 text-amber-100"
};

const statusLabel: Record<MovingAverageStatus, string> = {
  above: "ราคาอยู่เหนือเส้นค่าเฉลี่ย",
  below: "ราคาอยู่ต่ำกว่าเส้นค่าเฉลี่ย",
  neutral: "ราคาใกล้เคียงเส้นค่าเฉลี่ย",
  insufficient: "ข้อมูลยังไม่เพียงพอ"
};

const crossSignalLabel: Record<MovingAverages["crossSignal"], string> = {
  golden_cross: "Golden Cross",
  death_cross: "Death Cross",
  none: "ยังไม่พบ Cross ล่าสุด",
  insufficient: "ข้อมูลยังไม่เพียงพอ"
};

const crossSignalTone: Record<MovingAverages["crossSignal"], string> = {
  golden_cross: "border-emerald-400/40 bg-emerald-500/20 text-emerald-100",
  death_cross: "border-rose-400/40 bg-rose-500/20 text-rose-100",
  none: "border-slate-400/30 bg-slate-500/15 text-slate-200",
  insufficient: "border-amber-400/30 bg-amber-500/15 text-amber-100"
};

function formatAverage(value: number | null) {
  if (value == null) return "ข้อมูลยังไม่เพียงพอ";
  return value.toFixed(2);
}

function getExplanation(item: AverageItem) {
  if (item.status === "insufficient") return `${item.label} ยังคำนวณไม่ได้ เนื่องจากข้อมูลย้อนหลังยังไม่ครบตามจำนวนวันที่ต้องใช้`;
  if (item.status === "neutral") return `ราคาปัจจุบันอยู่ใกล้ ${item.label} ควรติดตามทิศทางต่อเนื่อง`;

  if (item.label === "MA20") {
    return item.status === "above"
      ? "ราคาปัจจุบันอยู่เหนือ MA20 อาจสะท้อนแรงซื้อระยะสั้น"
      : "ราคาปัจจุบันต่ำกว่า MA20 อาจสะท้อนแรงอ่อนตัวระยะสั้น";
  }

  if (item.label === "MA50") {
    return item.status === "above"
      ? "ราคาปัจจุบันอยู่เหนือ MA50 อาจสะท้อนว่าแนวโน้มระยะกลางยังแข็งแรง"
      : "ราคาปัจจุบันต่ำกว่า MA50 อาจสะท้อนว่าแนวโน้มระยะกลางเริ่มอ่อนตัว";
  }

  return item.status === "above"
    ? "ราคาปัจจุบันอยู่เหนือ MA200 อาจสะท้อนว่าแนวโน้มระยะยาวยังเป็นบวก"
    : "ราคาปัจจุบันต่ำกว่า MA200 อาจสะท้อนว่าแนวโน้มระยะยาวอยู่ภายใต้แรงกดดัน";
}

function getCrossExplanation(crossSignal: MovingAverages["crossSignal"]) {
  if (crossSignal === "golden_cross") return "Golden Cross คือสัญญาณเชิงเทคนิคที่ MA50 ตัดขึ้นเหนือ MA200 ควรติดตามความต่อเนื่องของแนวโน้ม";
  if (crossSignal === "death_cross") return "Death Cross คือสัญญาณเชิงเทคนิคที่ MA50 ตัดลงต่ำกว่า MA200 ควรติดตามแรงกดดันของแนวโน้ม";
  if (crossSignal === "insufficient") return "ยังไม่สามารถประเมิน Golden Cross หรือ Death Cross ได้ เพราะข้อมูล MA50 และ MA200 ยังไม่เพียงพอ";
  return "ยังไม่พบสัญญาณ Golden Cross หรือ Death Cross ล่าสุดจากข้อมูลที่มี";
}

export function MovingAveragePanel({ movingAverages }: MovingAveragePanelProps) {
  const items: AverageItem[] = [
    { label: "MA20", value: movingAverages.ma20, status: movingAverages.priceVsMA20 },
    { label: "MA50", value: movingAverages.ma50, status: movingAverages.priceVsMA50 },
    { label: "MA200", value: movingAverages.ma200, status: movingAverages.priceVsMA200 }
  ];

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Technical Analysis</p>
          <h2 className="mt-1 text-xl font-bold text-white">Moving Average System</h2>
          <p className="mt-1 text-sm text-slate-300">วิเคราะห์ตำแหน่งราคาปัจจุบันเทียบกับค่าเฉลี่ย MA20, MA50 และ MA200</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${crossSignalTone[movingAverages.crossSignal]}`}>
          {crossSignalLabel[movingAverages.crossSignal]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">{item.label}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${statusTone[item.status]}`}>{statusLabel[item.status]}</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-white">{formatAverage(item.value)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{getExplanation(item)}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${crossSignalTone[movingAverages.crossSignal]}`}>
            {crossSignalLabel[movingAverages.crossSignal]}
          </span>
          <p className="text-sm text-slate-300">{getCrossExplanation(movingAverages.crossSignal)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        สัญญาณ Moving Average เป็นการวิเคราะห์จากข้อมูลย้อนหลัง ไม่สามารถการันตีผลลัพธ์ในอนาคต
      </p>
    </section>
  );
}
