"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function CompareDropZone({ selected, onRemove, onDropSymbol, onClearAll }: { selected: string[]; onRemove: (s: string) => void; onDropSymbol: (s: string) => void; onClearAll: () => void }) {
  const { locale, t } = useI18n();
  return (
    <section onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onDropSymbol(e.dataTransfer.getData("text/plain")); }} className="mt-4 rounded-3xl border border-dashed border-white/20 bg-black/20 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-200">{locale === "th" ? "เพิ่มหุ้น 2–4 ตัวเพื่อเปรียบเทียบ" : "Add 2–4 stocks for comparison"}</p>
        <p className="text-xs text-slate-400">{locale === "th" ? "เลือกแล้ว" : "Selected"} {selected.length}/4</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {selected.map((symbol) => <span key={symbol} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white">{symbol}<button type="button" aria-label={`${t("common.remove")} ${symbol}`} onClick={() => onRemove(symbol)} className="text-rose-300">×</button></span>)}
      </div>
      <button type="button" onClick={onClearAll} className="mt-4 text-xs font-semibold text-slate-300 underline underline-offset-4">{t("compare.clearAll")}</button>
    </section>
  );
}
