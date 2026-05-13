"use client";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompareStockResult } from "@/lib/types/compare";

type Props = { stocks: CompareStockResult[] };

const colors = ["#7dd3fc", "#f9a8d4", "#c4b5fd", "#86efac"];

export function NormalizedCompareChart({ stocks }: Props) {
  const rows = stocks[0]?.points.map((point, index) => {
    const row: Record<string, number | string> = { date: point.date.slice(5) };
    stocks.forEach((stock) => {
      const p = stock.points[index];
      if (p) {
        row[stock.symbol] = p.normalized;
        row[`${stock.symbol}_close`] = p.close;
      }
    });
    return row;
  }) ?? [];

  return <div className="h-[360px] w-full"> <ResponsiveContainer width="100%" height="100%"><LineChart data={rows}><XAxis dataKey="date"/><YAxis domain={[80, 180]}/><Tooltip formatter={(value, name, item) => {
    const symbol = String(name);
    const normalized = Number(value);
    const close = Number(item.payload[`${symbol}_close`] ?? 0);
    const pct = normalized - 100;
    return [`Norm ${normalized.toFixed(2)} | ${pct >= 0 ? "+" : ""}${pct.toFixed(2)}% | $${close.toFixed(2)}`, symbol];
  }} />{stocks.map((stock, idx) => <Line key={stock.symbol} dataKey={stock.symbol} dot={false} strokeWidth={2} stroke={colors[idx % colors.length]} />)}</LineChart></ResponsiveContainer></div>;
}
