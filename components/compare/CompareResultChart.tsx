"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareSeries } from "@/lib/types/compare";
import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";

const COLORS = ["#67e8f9", "#a78bfa", "#fb7185", "#34d399"];

export function CompareResultChart({ series }: { series: CompareSeries[] }) {
  const { locale } = useI18n();
  const rows = series[0]?.points.map((point, index) => {
    const row: Record<string, number | string> = { date: point.date };
    series.forEach((item) => {
      const p = item.points[index];
      if (p) {
        row[item.symbol] = p.normalized;
        row[`${item.symbol}_pct`] = p.percentChange;
        row[`${item.symbol}_close`] = p.close;
      }
    });
    return row;
  }) ?? [];
  const currencies = Object.fromEntries(series.map((item) => [item.symbol, item.metrics.currency ?? "USD"]));

  return (
    <SectionCard className="w-full">
      <div className="mb-4">
        <p className="section-kicker">{locale === "th" ? "กราฟผลลัพธ์" : "Result chart"}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{locale === "th" ? "ผลการเคลื่อนไหวแบบปรับฐาน" : "Normalized performance"}</h2>
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
                const close = formatMarketCurrency(Number(item.payload[`${symbol}_close`]), currencies[symbol] ?? "USD");
                const label = locale === "th" ? `ปรับฐาน ${normalized} | ${pct}% | ${close}` : `Norm ${normalized} | ${pct}% | ${close}`;
                return [label, symbol];
              }}
            />
            <Legend />
            {series.map((item, idx) => <Line key={item.symbol} dataKey={item.symbol} stroke={COLORS[idx]} dot={false} strokeWidth={2.5} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
