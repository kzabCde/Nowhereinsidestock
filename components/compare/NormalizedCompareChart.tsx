"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareSeries } from "@/lib/types/compare";

type Props = { series: CompareSeries[] };

const colors = ["#7dd3fc", "#f9a8d4", "#c4b5fd", "#86efac"];

export function NormalizedCompareChart({ series }: Props) {
  const rows = series[0]?.points.map((point, index) => {
    const row: Record<string, number | string> = { date: point.date.slice(5) };
    series.forEach((stock) => {
      const p = stock.points[index];
      if (p) {
        row[stock.symbol] = p.normalized;
        row[`${stock.symbol}_close`] = p.close;
      }
    });
    return row;
  }) ?? [];

  return <div className="h-[260px] w-full min-w-0 sm:h-[360px]"> <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ left: 8, right: 8 }}><XAxis dataKey="date" tick={{ fontSize: 10 }}/><YAxis domain={[80, 180]} tick={{ fontSize: 10 }} width={34}/><Tooltip formatter={(value, name, item) => {
    const symbol = String(name);
    const normalized = Number(value);
    const close = Number(item.payload[`${symbol}_close`] ?? 0);
    const pct = normalized - 100;
    return [`Norm ${normalized.toFixed(2)} | ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% | $${close.toFixed(2)}`, symbol];
  }} />{series.map((stock, idx) => <Line key={stock.symbol} dataKey={stock.symbol} dot={false} strokeWidth={2} stroke={colors[idx % colors.length]} name={stock.symbol.slice(0, 6)} />)}</LineChart></ResponsiveContainer></div>;
}
