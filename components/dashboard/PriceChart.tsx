"use client";

import { useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PriceZone, QuoteResponse } from "@/lib/types/market";

type PriceChartProps = {
  data: QuoteResponse;
  supports?: PriceZone[];
  resistances?: PriceZone[];
};

type MovingAverageKey = "ma20" | "ma50" | "ma200";

const movingAverageLines: Array<{ key: MovingAverageKey; label: string; stroke: string; dash?: string }> = [
  { key: "ma20", label: "Show MA20", stroke: "#43E67B" },
  { key: "ma50", label: "Show MA50", stroke: "#FBBF24", dash: "5 5" },
  { key: "ma200", label: "Show MA200", stroke: "#F472B6", dash: "8 4" }
];

export function PriceChart({ data, supports = [], resistances = [] }: PriceChartProps) {
  const [visibleAverages, setVisibleAverages] = useState<Record<MovingAverageKey, boolean>>({
    ma20: true,
    ma50: true,
    ma200: false
  });

  const chartData = data.candles.map((candle, i) => ({
    date: candle.date.slice(5),
    close: candle.close,
    ma20: data.indicators.sma20[i] ?? null,
    ma50: data.indicators.sma50[i] ?? null,
    ma200: data.indicators.sma200[i] ?? null
  }));

  const toggleAverage = (key: MovingAverageKey) => {
    setVisibleAverages((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  return (
    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-panel/70 p-3 backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-white">Price Chart</p>
          <p className="text-xs text-slate-400">เลือกเส้น Moving Average เพื่อซ้อนบนกราฟราคา</p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          {movingAverageLines.map((line) => (
            <label key={line.key} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={visibleAverages[line.key]}
                onChange={() => toggleAverage(line.key)}
                className="h-3 w-3 accent-sky-400"
              />
              <span className="h-2 w-4 rounded-full" style={{ backgroundColor: line.stroke }} />
              {line.label}
            </label>
          ))}
        </div>
      </div>
      <div className="h-[260px] w-full min-w-0 sm:h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={42} />
            <Tooltip contentStyle={{ background: "#0B1320", border: "1px solid #1F2A3D" }} />
            {supports.map((zone) => (
              <ReferenceLine key={`support-${zone.level.toFixed(4)}`} y={zone.level} stroke="#34D399" strokeDasharray="4 4" strokeOpacity={0.55} />
            ))}
            {resistances.map((zone) => (
              <ReferenceLine key={`resistance-${zone.level.toFixed(4)}`} y={zone.level} stroke="#FB7185" strokeDasharray="4 4" strokeOpacity={0.55} />
            ))}
            <Line dataKey="close" name="Close" stroke="#47A8FF" dot={false} strokeWidth={2} />
            {movingAverageLines.map((line) =>
              visibleAverages[line.key] ? (
                <Line
                  key={line.key}
                  dataKey={line.key}
                  name={line.key.toUpperCase()}
                  stroke={line.stroke}
                  strokeDasharray={line.dash}
                  dot={false}
                  connectNulls={false}
                  strokeWidth={1.6}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
