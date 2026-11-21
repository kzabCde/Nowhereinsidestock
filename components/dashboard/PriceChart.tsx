"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
import { browserStorage } from "@/lib/client/browser-storage";
import { toHeikinAshi } from "@/lib/analysis/heikin-ashi";
import { formatMarketCurrency } from "@/lib/format/market";
import type { ChartRange, PriceZone, QuoteChart } from "@/lib/types/market";

type PriceChartProps = { data: QuoteChart; supports?: PriceZone[]; resistances?: PriceZone[] };
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
  volume: number | null;
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

const chartSettings = browserStorage("nis-chart-settings-v1");
const RANGE_TTL_MS = 300_000;
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

function parseSettings(raw: string | null): ChartSettings {
  try {
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
  const volume = point.volume == null ? "—" : new Intl.NumberFormat(numberLocale, { notation: "compact", maximumFractionDigits: 1 }).format(point.volume);

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
  const [rangeData, setRangeData] = useState<QuoteChart | null>(null);
  const rawSettings = useSyncExternalStore(chartSettings.subscribe, chartSettings.read, () => null);
  const settings = useMemo(() => parseSettings(rawSettings), [rawSettings]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingRange, setLoadingRange] = useState<ChartRange | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const ranges = useRef(new Map<ChartRange, { response: QuoteChart; received: number }>());
  const { locale } = useI18n();
  const chartDataSource = rangeData ?? data;
  const selectedRange = chartDataSource.chart.range;

  useEffect(() => () => activeRequest.current?.abort(), []);

  const candleSource = useMemo(
    () => settings.style === "heikinAshi" ? toHeikinAshi(chartDataSource.candles) : chartDataSource.candles,
    [chartDataSource.candles, settings.style]
  );

  const chartData = useMemo<ChartPoint[]>(() => candleSource.map((candle, i) => ({
    date: candle.date.slice(0, 10),
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

  const currency = chartDataSource.currency ?? "";
  const sameCurrency = data.currency === chartDataSource.currency;
  const candleMode = settings.style === "candlestick" || settings.style === "heikinAshi";

  const updateSetting = <K extends keyof Omit<ChartSettings, "averages">>(key: K, value: ChartSettings[K]) =>
    chartSettings.write(JSON.stringify({ ...settings, [key]: value }));
  const toggleAverage = (key: MovingAverageKey) => chartSettings.write(JSON.stringify({
    ...settings, averages: { ...settings.averages, [key]: !settings.averages[key] }
  }));
  const resetSettings = () => chartSettings.write(JSON.stringify(DEFAULT_SETTINGS));

  async function handleRangeChange(range: ChartRange) {
    if (loadingRange === range) return;
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoadingRange(null);
    setErrorMessage(null);
    if (range === data.chart.range) {
      setRangeData(null);
      return;
    }
    const cached = ranges.current.get(range);
    if (cached && Date.now() - cached.received < RANGE_TTL_MS) {
      setRangeData(cached.response);
      return;
    }
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoadingRange(range);
    try {
      const response = await fetch(`/api/stocks/${encodeURIComponent(data.symbol)}?view=chart&range=${range}`, { signal: controller.signal });
      if (!response.ok) throw Error(locale === "th" ? `ไม่สามารถโหลดกราฟช่วง ${range}` : `Unable to load the ${range} chart.`);
      const chart = (await response.json()) as QuoteChart;
      if (controller.signal.aborted) return;
      if (!chart.historyStale) ranges.current.set(range, { response: chart, received: Date.now() });
      setRangeData(chart);
    } catch (reason) {
      if (!controller.signal.aborted) setErrorMessage(reason instanceof Error ? reason.message : "Chart unavailable");
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoadingRange(null);
      }
    }
  }

  const styleOptions: Array<{ id: ChartStyle; labelTh: string; labelEn: string }> = [
    { id: "line", labelTh: "เส้น", labelEn: "Line" },
    { id: "area", labelTh: "พื้นที่", labelEn: "Area" },
    { id: "bars", labelTh: "แท่งราคา", labelEn: "Price Bars" },
    { id: "candlestick", labelTh: "Candlestick", labelEn: "Candlestick" },
    { id: "heikinAshi", labelTh: "Heikin-Ashi", labelEn: "Heikin-Ashi" }
  ];

  return (
    <div className="w-full min-w-0 rounded-2xl border border-white/10 bg-elevated p-3 sm:p-4">
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{locale === "th" ? "กราฟราคา" : "Price Chart"}</p>
            <p className="text-xs text-slate-400">{chartDataSource.chart.interval === "1wk" ? locale === "th" ? "แท่งรายสัปดาห์" : "Weekly bars" : locale === "th" ? "แท่งรายวัน" : "Daily bars"} · {locale === "th" ? "เส้น MA คำนวณจากรอบรายวัน" : "MA overlays use daily sessions"}</p>
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
                      aria-pressed={settings.style === option.id}
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
        {loadingRange && <p role="status" className="text-xs text-slate-400">{locale === "th" ? "กำลังโหลด" : "Loading"} {loadingRange}…</p>}
        {chartDataSource.historyStale && <p role="status" className="text-xs text-warning">{locale === "th" ? "แสดงกราฟล่าสุดที่มี" : "Showing the last available chart."}</p>}
        {errorMessage && <p role="alert" className="text-xs text-warning">{errorMessage}</p>}
      </div>

      {chartData.length ? <div className="relative h-[280px] w-full min-w-0 sm:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            {settings.showGrid ? <CartesianGrid stroke="rgba(148,163,184,0.08)" vertical={false} /> : null}
            <XAxis dataKey="date" tickFormatter={(value: string) => chartDataSource.chart.interval === "1wk" ? value.slice(0, 7) : value.slice(5)} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis yAxisId="price" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={48} />
            <YAxis yAxisId="volume" orientation="right" hide domain={[0, "dataMax"]} />
            <Tooltip content={<PriceTooltip currency={currency} locale={locale} candleMode={candleMode} />} />

            {settings.showVolume ? <Bar yAxisId="volume" dataKey="volume" name="Volume" fill="rgba(148,163,184,0.18)" maxBarSize={8} isAnimationActive={false} /> : null}

            {settings.showZones && sameCurrency ? supports.map((zone) => <ReferenceLine yAxisId="price" key={`support-${zone.level.toFixed(4)}`} y={zone.level} stroke="#34D399" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}
            {settings.showZones && sameCurrency ? resistances.map((zone) => <ReferenceLine yAxisId="price" key={`resistance-${zone.level.toFixed(4)}`} y={zone.level} stroke="#FB7185" strokeDasharray="4 4" strokeOpacity={0.55} />) : null}

            {settings.style === "line" ? <Line yAxisId="price" dataKey="close" name="Close" stroke="#d6b36a" dot={false} strokeWidth={2} isAnimationActive={false} /> : null}
            {settings.style === "area" ? <Area yAxisId="price" dataKey="close" name="Close" type="monotone" stroke="#d6b36a" fill="rgba(214,179,106,0.16)" strokeWidth={2} dot={false} isAnimationActive={false} /> : null}
            {settings.style === "bars" ? <Bar yAxisId="price" dataKey="close" name="Close" fill="#d6b36a" maxBarSize={7} radius={[2, 2, 0, 0]} isAnimationActive={false} /> : null}
            {candleMode ? <Bar yAxisId="price" dataKey="candleRange" name={settings.style === "heikinAshi" ? "Heikin-Ashi" : "OHLC"} shape={<CandlestickShape />} maxBarSize={12} isAnimationActive={false} /> : null}

            {movingAverageLines.map((line) => settings.averages[line.key] ? <Line yAxisId="price" key={line.key} dataKey={line.key} name={`${line.key.toUpperCase()} (1D)`} stroke={line.stroke} strokeDasharray={line.dash} dot={false} connectNulls={false} strokeWidth={1.6} isAnimationActive={false} /> : null)}
          </ComposedChart>
        </ResponsiveContainer>
      </div> : <p className="py-6 text-sm text-slate-400">{locale === "th" ? "ไม่มีข้อมูลกราฟสำหรับช่วงนี้" : "No chart observations for this range."}</p>}
    </div>
  );
}
