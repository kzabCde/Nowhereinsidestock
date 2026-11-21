"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { priceByDate } from "@/lib/finance/trading-dates";
import type { CompareSeries } from "@/lib/types/compare";
import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";

const COLORS = ["#67e8f9", "#a78bfa", "#fb7185", "#34d399"];

export function CompareResultChart({ series }: { series: CompareSeries[] }) {
  const { locale } = useI18n();
  const byDate = new Map<string, Record<string, number | string>>();
  for (const item of series) {
    for (const [date, point] of priceByDate(item.points)) {
      const row = byDate.get(date) ?? { date };
      row[item.symbol] = point.normalized;
      row[`${item.symbol}_pct`] = point.percentChange;
      row[`${item.symbol}_close`] = point.close;
      byDate.set(date, row);
    }
  }
  const rows = [...byDate.values()].sort((left, right) => String(left.date).localeCompare(String(right.date)));
  const currencies = Object.fromEntries(series.map((item) => [item.symbol, item.metrics.currency]));

  return (
    <SectionCard className="w-full">
      <div className="mb-4">
        <p className="section-kicker">{locale === "th" ? "กราฟผลลัพธ์" : "Result chart"}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{locale === "th" ? "ผลการเคลื่อนไหวแบบปรับฐาน" : "Normalized performance"}</h2>
        <p className="mt-1 text-sm text-slate-500">{locale === "th" ? "ฐาน 100 ณ วันซื้อขายร่วมวันแรก · ผลตอบแทนในสกุลเงินท้องถิ่น" : "Base 100 on the first shared trading date · returns in local currency"}</p>
      </div>
      <div className="h-[300px] w-full min-w-0 sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ background: "rgba(8,8,10,0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }}
              formatter={(value, name, item) => {
                const symbol = String(name);
                const normalized = Number(value).toFixed(2);
                const pct = Number(item.payload[`${symbol}_pct`]).toFixed(2);
                const rawClose = Number(item.payload[`${symbol}_close`]);
                const currency = currencies[symbol];
                const close = currency ? formatMarketCurrency(rawClose, currency) : rawClose.toFixed(2);
                const label = locale === "th" ? `ปรับฐาน ${normalized} | ${pct}% | ${close}` : `Norm ${normalized} | ${pct}% | ${close}`;
                return [label, symbol];
              }}
            />
            <Legend />
            {series.map((item, idx) => <Line key={item.symbol} dataKey={(row) => row[item.symbol] ?? null} name={item.symbol} connectNulls={false} isAnimationActive={false} stroke={COLORS[idx]} dot={false} strokeWidth={2.5} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
