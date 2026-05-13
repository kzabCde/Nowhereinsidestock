"use client";

import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareSeries } from "@/lib/types/compare";

const COLORS = ["#38bdf8", "#a78bfa", "#fb7185", "#34d399"];

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

  return <section className="printstream-shell pearl-border rounded-3xl p-4"><div className="h-[260px] sm:h-[380px]"><ResponsiveContainer><LineChart data={rows}><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value, name, item) => [`Norm ${Number(value).toFixed(2)} | ${Number(item.payload[`${String(name)}_pct`]).toFixed(2)}% | $${Number(item.payload[`${String(name)}_close`]).toFixed(2)}`, String(name)]} /><Legend />{series.map((item, idx) => <Line key={item.symbol} dataKey={item.symbol} stroke={COLORS[idx]} dot={false} strokeWidth={2} />)}</LineChart></ResponsiveContainer></div></section>;
}
