"use client";

import { useEffect, useRef, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTimeframeSelector } from "@/components/stocks/ChartTimeframeSelector";
import type { ChartRange, PriceZone, QuoteResponse } from "@/lib/types/market";

type PriceChartProps = {
  data: QuoteResponse;
  supports?: PriceZone[];
  resistances?: PriceZone[];
};

type MovingAverageKey = "ma20" | "ma50" | "ma200";

const DEFAULT_RANGE: ChartRange = "6M";

const movingAverageLines: Array<{ key: MovingAverageKey; label: string; stroke: string; dash?: string }> = [
  { key: "ma20", label: "Show MA20", stroke: "#43E67B" },
  { key: "ma50", label: "Show MA50", stroke: "#FBBF24", dash: "5 5" },
  { key: "ma200", label: "Show MA200", stroke: "#F472B6", dash: "8 4" }
];

export function PriceChart({ data, supports = [], resistances = [] }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<ChartRange>(DEFAULT_RANGE);
  const [chartDataSource, setChartDataSource] = useState<QuoteResponse>(data);
  const [visibleAverages, setVisibleAverages] = useState<Record<MovingAverageKey, boolean>>({
    ma20: true,
    ma50: true,
    ma200: false
  });
  const [loadingRange, setLoadingRange] = useState<ChartRange | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const previousSymbol = useRef(data.symbol);

  useEffect(() => {
    if (previousSymbol.current !== data.symbol) {
      previousSymbol.current = data.symbol;
      activeRequest.current?.abort();
      setSelectedRange(DEFAULT_RANGE);
      setChartDataSource(data);
      setLoadingRange(null);
      setErrorMessage(null);
      return;
    }

    if (selectedRange === DEFAULT_RANGE && loadingRange == null) {
      setChartDataSource(data);
    }
  }, [data, loadingRange, selectedRange]);

  useEffect(() => {
    return () => activeRequest.current?.abort();
  }, []);

  const chartData = chartDataSource.candles.map((candle, i) => ({
    date: candle.date.slice(5),
    close: candle.close,
    ma20: chartDataSource.indicators.sma20[i] ?? null,
    ma50: chartDataSource.indicators.sma50[i] ?? null,
    ma200: chartDataSource.indicators.sma200[i] ?? null
  }));

  const activeSupports = chartDataSource.supportResistance.supports.length > 0 ? chartDataSource.supportResistance.supports : supports;
  const activeResistances = chartDataSource.supportResistance.resistances.length > 0 ? chartDataSource.supportResistance.resistances : resistances;

  const toggleAverage = (key: MovingAverageKey) => {
    setVisibleAverages((current) => ({
      ...current,
      [key]: !current[key]
    }));
  };

  const handleRangeChange = async (range: ChartRange) => {
    if (range === selectedRange || loadingRange === range) return;

    const previousRange = selectedRange;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setSelectedRange(range);
    setLoadingRange(range);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/stocks/${encodeURIComponent(data.symbol)}?range=${range}`, {
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Unable to load ${range} chart data.`);
      }

      const nextData = (await response.json()) as QuoteResponse;
      setChartDataSource(nextData);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSelectedRange(previousRange);
      setErrorMessage(error instanceof Error ? error.message : "Unable to load chart data.");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoadingRange(null);
      }
    }
  };

  return (
    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-panel/70 p-3 backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Price Chart</p>
            <p className="text-xs text-slate-400">เลือกช่วงเวลาและเส้น Moving Average เพื่อซ้อนบนกราฟราคา</p>
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
        <ChartTimeframeSelector value={selectedRange} onChange={(range) => void handleRangeChange(range)} />
        {errorMessage ? <p className="text-xs text-rose-300">{errorMessage}</p> : null}
      </div>
      <div className="relative h-[260px] w-full min-w-0 sm:h-[360px]">
        {loadingRange ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm">
            Loading {loadingRange}
          </div>
        ) : null}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={42} />
            <Tooltip contentStyle={{ background: "#0B1320", border: "1px solid #1F2A3D" }} />
            {activeSupports.map((zone) => (
              <ReferenceLine key={`support-${zone.level.toFixed(4)}`} y={zone.level} stroke="#34D399" strokeDasharray="4 4" strokeOpacity={0.55} />
            ))}
            {activeResistances.map((zone) => (
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
