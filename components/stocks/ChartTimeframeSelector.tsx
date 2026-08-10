"use client";

import type { ChartRange } from "@/lib/types/market";
import { useI18n } from "@/components/i18n/I18nProvider";

type ChartTimeframeSelectorProps = { value: ChartRange; onChange: (value: ChartRange) => void };
const ranges: ChartRange[] = ["1M", "3M", "6M", "1Y", "3Y", "5Y"];

export function ChartTimeframeSelector({ value, onChange }: ChartTimeframeSelectorProps) {
  const { locale } = useI18n();
  return (
    <div className="w-full max-w-full overflow-x-auto pb-1" aria-label={locale === "th" ? "เลือกช่วงเวลาของกราฟ" : "Chart timeframe selector"}>
      <div className="flex min-w-max items-center gap-2 pr-1">
        {ranges.map((range) => {
          const isActive = value === range;
          return <button aria-pressed={isActive} aria-label={locale === "th" ? `ช่วงเวลา ${range}` : `${range} timeframe`} className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition focus:outline-none focus:ring-2 focus:ring-cyan-200/50 ${isActive ? "border-cyan-200/80 bg-cyan-200/10 text-cyan-50 shadow-[0_0_18px_rgba(103,232,249,0.16)]" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-cyan-200/40 hover:text-white"}`} key={range} onClick={() => onChange(range)} type="button">{range}</button>;
        })}
      </div>
    </div>
  );
}
