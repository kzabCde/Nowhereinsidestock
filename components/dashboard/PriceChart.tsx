"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartTimeframeSelector } from "@/components/stocks/ChartTimeframeSelector";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { ChartRange, PriceZone, QuoteResponse } from "@/lib/types/market";

type PriceChartProps = { data: QuoteResponse; supports?: PriceZone[]; resistances?: PriceZone[] };
type MovingAverageKey = "ma20" | "ma50" | "ma200";
type ChartStyle = "line" | "area" | "bars";
type ChartSettings = {
  style: ChartStyle;
  showVolume: boolean;
  showGrid: boolean;
  showZones: boolean;
  averages: Record<MovingAverageKey, boolean>;
};

const DEFAULT_RANGE: ChartRange = "6M";
const SETTINGS_KEY = "nis-chart-settings-v1";
const DEFAULT_SETTINGS: ChartSettings = {
  style: "line",
  showVolume: true,
  showGrid: true,
  showZones: true,
  averages: { ma20: true, ma50: true, ma200: false }
};

const movingAverageLines: Array<{ key: MovingAverageKey; stroke: string; dash?: string }> = [
  { key: "ma20", stroke: "#43E67B" },
  { key: "ma50", stroke: "#FBBF24", dash: "5 5" },
  { key: "ma200", stroke: "#F472B6", dash: "8 4" }
];

function loadSettings(): ChartSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ChartSettings>;
    const style: ChartStyle = parsed.style === "area" || parsed.style === "bars" || parsed.style === "line" ? parsed.style : DEFAULT_SETTINGS.style;
    return {
      style,
      showVolume: typeof parsed.showVolume === "boolean" ? parsed.showVolume : DEFAULT_SETTINGS.showVolume,
      showGrid: typeof parsed.showGrid === "boolean" ? parsed.showGrid : DEFAULT_SETTINGS.showGrid,
      showZones: typeof parsed.showZones === "boolean" ? parsed.showZones : DEFAULT_SETTINGS.showZones,
      averages: {
        ma20: typeof parsed.averages?.ma20 === "boolean" ? parsed.averages.ma20 : DEFAULT_SETTINGS.averages.ma20,
        ma50: typeof parsed.averages?.ma50 === "boolean" ? parsed.averages.ma50 : DEFAULT_SETTINGS.averages.ma50,
        ma200: typeof parsed.averages?.ma200 === "boolean" ? parsed.averages.ma200 : DEFAULT_SETTINGS.averages.ma200
      }
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function PriceChart({ data, supports = [], resistances = [] }: PriceChartProps) {
  const [selectedRange, setSelectedRange] = useState<ChartRange>(DEFAULT_RANGE);
  const [chartDataSource, setChartDataSource] = useState<QuoteResponse>(data);
  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingRange, setLoadingRange] = useState<ChartRange | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const previousSymbol = useRef(data.symbol);
  const { locale } = useI18n();

  useEffect(() => {
    setSettings(loadSettings());
    setSettingsReady(true);
  }, []);

  useEffect(() => {
    if (!settingsReady) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings, settingsReady]);

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
    if (selectedRange === DEFAULT_RANGE && loadingRange == null) setChartDataSource(data);
  }, [data, loadingRange, selectedRange]);

  useEffect(() => () => activeRequest.current?.abort(), []);

  const chartData = useMemo(() => chartDataSource.candles.map((candle, i) => ({
    date: candle.date.slice(5, 10),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    ma20: chartDataSource.indicators.sma20[i] ?? null,
    ma50: chartDataSource.indicators.sma50[i] ?? null,
    ma200: chartDataSource.indicators.sma200[i] ?? null
  })), [chartDataSource]);

  const activeSupports = chartDataSource.supportResistance.supports.length > 0 ? chartDataSource.supportResistance.supports : supports;
  const activeResistances = chartDataSource.supportResistance.resistances.length > 0 ? chartDataSource.supportResistance.resistances : resistances;
  const currency = chartDataSource.currency ?? "USD";

  const updateSetting = <K extends keyof Omit<ChartSettings, "averages">>(key: K, value: ChartSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };
  const toggleAverage = (key: MovingAverageKey) => setSettings((current) => ({
    ...current,
    averages: { ...current.averages, [key]: !current.averages[key] }
  }));
  const resetSettings = () => setSettings(DEFAULT_SETTINGS);

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
      const response = await fetch(`/api/stocks/${encodeURIComponent(data.symbol)}?range=${range}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error(locale === "th" ? `ไม่สามารถโหลดข้อมูลกราฟช่วง ${range} ได้` : `Unable to load ${range} chart data.`);
      setChartDataSource((await response.json()) as QuoteResponse);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setSelectedRange(previousRange);
      setErrorMessage(error instanceof Error ? error.message : (locale === "th" ? "ไม่สามารถโหลดข้อมูลกราฟได้" : "Unable to load chart data."));
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoadingRange(null);
      }
    }
  };

  const styleOptions: Array<{ id: ChartStyle; labelTh: string; labelEn: string }> = [
    { id: "line", labelTh: "เส้น", labelEn: "Line" },
    { id: "area", labelTh: "พื้นที่", labelEn: "Area" },
    { id: "bars", labelTh: "แท่งราคา", labelEn: "Price Bars" }
  ];

  return (
    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-panel/70 p-3 backdrop-blur sm:p-4">
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{locale === "th" ? "กราฟราคา" : "Price Chart"}</p>
            <p className="text-xs text-slate-400">{locale === "th" ? "เลือกรูปแบบ ช่วงเวลา และข้อมูลประกอบที่ต้องการแสดง" : "Choose the chart style, timeframe, and overlays you want to display."}</p>
          </div>
          <button
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${settingsOpen ? "border-accent/35 bg-accent/[0.08] text-accent" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"}`}
            onClick={() => setSettingsOpen((open) => !open)}
            type="button"
            aria-expanded={settingsOpen}
          >
            {locale === "th" ? "ตั้งค่ากราฟ" : "Chart settings"}
          </button>
        </div>

        {settingsOpen ? (
          <div className="rounded-xl border border-white/[0.08] bg-black/15 p-3 sm:p-4">
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{locale === "th" ? "รูปแบบกราฟ" : "Chart style"}</p>
                <div className="flex flex-wrap gap-2">
                  {styleOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateSetting("style", option.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${settings.style === option.id ? "border-accent/40 bg-accent/[0.1] text-[#f1dca9]" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}
                    >
                      {locale === "th" ? option.labelTh : option.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{locale === "th" ? "ข้อมูลประกอบ" : "Overlays"}</p>
                <div className="flex flex-wrap gap-2">
                  {movingAverageLines.map((line) => (
                    <label key={line.key} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                      <input type="checkbox" checked={settings.averages[line.key]} onChange={() => toggleAverage(line.key)} className="h-3 w-3 accent-sky-400" />
                      <span className="h-2 w-4 rounded-full" style={{ backgroundColor: line.stroke }} />
                      {line.key.toUpperCase()}
                    </label>
                  ))}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    <input type="checkbox" checked={settings.showVolume} onChange={(event) => updateSetting("showVolume", event.target.checked)} className="h-3 w-3 accent-sky-400" />
                    {locale === "th" ? "Volume" : "Volume"}
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    <input type="checkbox" checked={settings.showZones} onChange={(event) => updateSetting("showZones", event.target.checked)} className="h-3 w-3 accent-sky-400" />
                    {locale === "th" ? "แนวรับ/แนวต้าน" : "Support / Resistance"}
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200">
                    <input type="checkbox" checked={settings.showGrid} onChange={(event) => updateSetting("showGrid", event.target.checked)} className="h-3 w-3 accent-sky-400" />
                    {locale === "th" ? "เส้นกริด" : "Grid"}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                <p className="text-[11px] text-slate-600">{locale === "th" ? "การตั้งค่าจะถูกจำไว้บนอุปกรณ์นี้" : "Settings are remembered on this device."}</p>
                <button type="button" onClick={resetSettings} className="text-xs font-medium text-slate-500 transition hover:text-white">{locale === "th" ? "คืนค่าเริ่มต้น" : "Reset"}</button>
              </div>
            </div>
          </div>
        ) : null}

        <ChartTimeframeSelector value={selectedRange} onChange={(range) => void handleRangeChange(range)} />
        {errorMessage ? <p className="text-xs text-rose-300">{errorMessage}</p> : null}
      </div>

      <div className="relative h-[280px] w-full min-w-0 sm:h-[380px]">
        {loadingRange ? <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-950/50 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm">{locale === "th" ? "กำลังโหลด" : "Loading"} {loadingRange}</div> : null}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            {settings.showGrid ? <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /> : null}
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis yAxisId="price" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={48} />
            <YAxis yAxisId="volume" orientation="right" hide domain={[0, "dataMax"]} />
            <Tooltip
              contentStyle={{ background: "#0B1320", border: "1px solid #1F2A3D", borderRadius: 10 }}
              formatter={(value, name) => {
                if (name === "Volume") return [new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value)), locale === "th" ? "ปริมาณซื้อขาย" : "Volume"];
                const translatedName = name === "Close" ? (locale === "th" ? "ราคาปิด" : "Close") : String(name).toUpperCase();
                return [formatMarketCurrency(Number(value), currency), translatedName];
              }}
            />

            {settings.showVolume ? <Bar yAxisId="volume" dataKey="volume" name="Volume" fill="rgba(148,163,184,0.18)" maxBarSize={8} isAnimationActive={false} /> : null}

            {settings.showZones ? activeSupports.map((zone) => <ReferenceLine yAxisId="price" key={`support-${zone.level.toFixed(4)}`} y={zone.level} stroke="#34D399" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}
            {settings.showZones ? activeResistances.map((zone) => <ReferenceLine yAxisId="price" key={`resistance-${zone.level.toFixed(4)}`} y={zone.level} stroke="#FB7185" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}

            {settings.style === "line" ? <Line yAxisId="price" dataKey="close" name="Close" stroke="#47A8FF" dot={false} strokeWidth={2} isAnimationActive={false} /> : null}
            {settings.style === "area" ? <Area yAxisId="price" dataKey="close" name="Close" type="monotone" stroke="#47A8FF" fill="rgba(71,168,255,0.16)" strokeWidth={2} dot={false} isAnimationActive={false} /> : null}
            {settings.style === "bars" ? <Bar yAxisId="price" dataKey="close" name="Close" fill="#47A8FF" maxBarSize={7} radius={[2, 2, 0, 0]} isAnimationActive={false} /> : null}

            {movingAverageLines.map((line) => settings.averages[line.key] ? <Line yAxisId="price" key={line.key} dataKey={line.key} name={line.key.toUpperCase()} stroke={line.stroke} strokeDasharray={line.dash} dot={false} connectNulls={false} strokeWidth={1.6} isAnimationActive={false} /> : null)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
