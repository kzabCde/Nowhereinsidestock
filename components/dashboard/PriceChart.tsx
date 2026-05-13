"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { QuoteResponse } from "@/lib/types/market";

type PriceChartProps = {
  data: QuoteResponse;
};

export function PriceChart({ data }: PriceChartProps) {
  const chartData = data.candles.map((candle, i) => ({
    date: candle.date.slice(5),
    close: candle.close,
    sma20: data.indicators.sma20[i],
    ema20: data.indicators.ema20[i]
  }));

  return (
    <div className="h-[260px] w-full min-w-0 rounded-2xl border border-white/10 bg-panel/70 p-3 backdrop-blur sm:h-[360px] sm:p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
          <Tooltip contentStyle={{ background: "#0B1320", border: "1px solid #1F2A3D" }} />
          <Line dataKey="close" stroke="#47A8FF" dot={false} strokeWidth={2} />
          <Line dataKey="sma20" stroke="#43E67B" dot={false} strokeWidth={1.5} />
          <Line dataKey="ema20" stroke="#FBBF24" dot={false} strokeWidth={1.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
