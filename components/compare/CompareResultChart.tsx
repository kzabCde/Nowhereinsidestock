"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareSeries } from "@/lib/types/compare";
import { SectionCard } from "@/components/ui/SectionCard";

const COLORS = ["#67e8f9", "#a78bfa", "#fb7185", "#34d399"];

export function CompareResultChart({ series }: { series: CompareSeries[] }) {
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

  return (
    <SectionCard className="w-full">
      <div className="mb-4">
        <p className="section-kicker">Result chart</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Normalized performance</h2>
      </div>
      <div className="h-[300px] w-full min-w-0 sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
            <Tooltip
              contentStyle={{ background: "rgba(8,8,10,0.94)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16 }}
              formatter={(value, name, item) => [`Norm ${Number(value).toFixed(2)} | ${Number(item.payload[`${String(name)}_pct`]).toFixed(2)}% | $${Number(item.payload[`${String(name)}_close`]).toFixed(2)}`, String(name)]}
            />
            <Legend />
            {series.map((item, idx) => <Line key={item.symbol} dataKey={item.symbol} stroke={COLORS[idx]} dot={false} strokeWidth={2.5} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
