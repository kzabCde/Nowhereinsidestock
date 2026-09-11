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
import { toHeikinAshi } from "@/lib/analysis/heikin-ashi";
import { formatMarketCurrency } from "@/lib/format/market";
import type { ChartRange, PriceZone, QuoteResponse } from "@/lib/types/market";

type PriceChartProps = { data: QuoteResponse; supports?: PriceZone[]; resistances?: PriceZone[] };
type MovingAverageKey = "ma20" | "ma50" | "ma200";
type ChartStyle = "line" | "area" | "bars" | "candlestick" | "heikinAshi";
type ChartSettings = {
  style: ChartStyle;
  showVolume: boolean;
  showGrid: boolean;
  showZones: boolean;
  averages: Record<MovingAverageKey, boolean>;
};
type ChartPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candleRange: [number, number];
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
};
type CandleShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: ChartPoint;
};
type TooltipPayloadItem = { payload?: ChartPoint };
type PriceTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  currency: string;
  locale: "th" | "en";
  candleMode: boolean;
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
    const validStyles: ChartStyle[] = ["line", "area", "bars", "candlestick", "heikinAshi"];
    const style = validStyles.includes(parsed.style as ChartStyle) ? parsed.style as ChartStyle : DEFAULT_SETTINGS.style;
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

function CandlestickShape({ x = 0, y = 0, width = 0, height = 0, payload }: CandleShapeProps) {
  if (!payload) return null;
  const { open, high, low, close } = payload;
  const rising = close >= open;
  const color = rising ? "#34D399" : "#FB7185";
  const centerX = x + width / 2;
  const priceSpan = Math.max(high - low, Number.EPSILON);
  const priceToY = (price: number) => y + ((high - price) / priceSpan) * height;
  const openY = priceToY(open);
  const closeY = priceToY(close);
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1.5);
  const bodyWidth = Math.max(Math.min(width * 0.68, 9), 2);
  const bodyX = centerX - bodyWidth / 2;

  return (
    <g>
      <line x1={centerX} x2={centerX} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect
        x={bodyX}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        rx={0.75}
        fill={rising ? "#163e34" : "#4a2029"}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
}

function PriceTooltip({ active, payload, currency, locale, candleMode }: PriceTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload.find((item) => item.payload)?.payload;
  if (!point) return null;
  const numberLocale = locale === "th" ? "th-TH" : "en-US";
  const price = (value: number) => formatMarketCurrency(value, currency, numberLocale);
  const volume = new Intl.NumberFormat(numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(point.volume);

  return (
    <div className="rounded-xl border border-[#1F2A3D] bg-[#0B1320]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <p className="mb-2 font-semibold text-slate-200">{point.date}</p>
      {candleMode ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
          <span>{locale === "th" ? "เปิด" : "Open"}</span><span className="text-right tabular-nums text-slate-200">{price(point.open)}</span>
          <span>{locale === "th" ? "สูงสุด" : "High"}</span><span className="text-right tabular-nums text-slate-200">{price(point.high)}</span>
          <span>{locale === "th" ? "ต่ำสุด" : "Low"}</span><span className="text-right tabular-nums text-slate-200">{price(point.low)}</span>
          <span>{locale === "th" ? "ปิด" : "Close"}</span><span className="text-right tabular-nums text-slate-200">{price(point.close)}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-5 text-slate-400">
          <span>{locale === "th" ? "ราคาปิด" : "Close"}</span>
          <span className="tabular-nums text-slate-200">{price(point.close)}</span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-between gap-5 text-slate-500">
        <span>Volume</span><span className="tabular-nums">{volume}</span>
      </div>
    </div>
  );
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

  const candleSource = useMemo(
    () => settings.style === "heikinAshi" ? toHeikinAshi(chartDataSource.candles) : chartDataSource.candles,
    [chartDataSource.candles, settings.style]
  );

  const chartData = useMemo<ChartPoint[]>(() => candleSource.map((candle, i) => ({
    date: candle.date.slice(5, 10),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    candleRange: [candle.low, candle.high],
    ma20: chartDataSource.indicators.sma20[i] ?? null,
    ma50: chartDataSource.indicators.sma50[i] ?? null,
    ma200: chartDataSource.indicators.sma200[i] ?? null
  })), [candleSource, chartDataSource.indicators.sma20, chartDataSource.indicators.sma50, chartDataSource.indicators.sma200]);

  const activeSupports = chartDataSource.supportResistance.supports.length > 0 ? chartDataSource.supportResistance.supports : supports;
  const activeResistances = chartDataSource.supportResistance.resistances.length > 0 ? chartDataSource.supportResistance.resistances : resistances;
  const currency = chartDataSource.currency ?? "USD";
  const candleMode = settings.style === "candlestick" || settings.style === "heikinAshi";

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
    { id: "bars", labelTh: "แท่งราคา", labelEn: "Price Bars" },
    { id: "candlestick", labelTh: "Candlestick", labelEn: "Candlestick" },
    { id: "heikinAshi", labelTh: "Heikin-Ashi", labelEn: "Heikin-Ashi" }
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
                {settings.style === "heikinAshi" ? (
                  <p className="mt-2 text-[11px] leading-5 text-slate-600">
                    {locale === "th" ? "Heikin-Ashi เป็นราคาที่คำนวณจาก OHLC เพื่อช่วยกรองความผันผวน จึงไม่ใช่ราคาซื้อขายจริงของแต่ละแท่ง" : "Heikin-Ashi candles are derived from OHLC to smooth price action, so their displayed values are not the exact traded OHLC for each period."}
                  </p>
                ) : null}
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
                    Volume
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
            <Tooltip content={<PriceTooltip currency={currency} locale={locale} candleMode={candleMode} />} />

            {settings.showVolume ? <Bar yAxisId="volume" dataKey="volume" name="Volume" fill="rgba(148,163,184,0.18)" maxBarSize={8} isAnimationActive={false} /> : null}

            {settings.showZones ? activeSupports.map((zone) => <ReferenceLine yAxisId="price" key={`support-${zone.level.toFixed(4)}`} y={zone.level} stroke="#34D399" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}
            {settings.showZones ? activeResistances.map((zone) => <ReferenceLine yAxisId="price" key={`resistance-${zone.level.toFixed(4)}`} y={zone.level} stroke="#FB7185" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}

            {settings.style === "line" ? <Line yAxisId="price" dataKey="close" name="Close" stroke="#47A8FF" dot={false} strokeWidth={2} isAnimationActive={false} /> : null}
            {settings.style === "area" ? <Area yAxisId="price" dataKey="close" name="Close" type="monotone" stroke="#47A8FF" fill="rgba(71,168,255,0.16)" strokeWidth={2} dot={false} isAnimationActive={false} /> : null}
            {settings.style === "bars" ? <Bar yAxisId="price" dataKey="close" name="Close" fill="#47A8FF" maxBarSize={7} radius={[2, 2, 0, 0]} isAnimationActive={false} /> : null}
            {candleMode ? <Bar yAxisId="price" dataKey="candleRange" name={settings.style === "heikinAshi" ? "Heikin-Ashi" : "OHLC"} shape={<CandlestickShape />} maxBarSize={12} isAnimationActive={false} /> : null}

            {movingAverageLines.map((line) => settings.averages[line.key] ? <Line yAxisId="price" key={line.key} dataKey={line.key} name={line.key.toUpperCase()} stroke={line.stroke} strokeDasharray={line.dash} dot={false} connectNulls={false} strokeWidth={1.6} isAnimationActive={false} /> : null)}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
