"use client";

import { useMemo, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { Activity, Calculator, Languages, Layers, LayoutDashboard, Radar, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";
import { MovingAveragePanel } from "@/components/stocks/MovingAveragePanel";
import { NextSignalPanel } from "@/components/stocks/NextSignalPanel";
import { SupportResistancePanel } from "@/components/stocks/SupportResistancePanel";
import { ThaiStockSummary } from "@/components/stocks/ThaiStockSummary";
import type { QuoteResponse } from "@/lib/types/market";

export type StockDetailTab =
  | "overview"
  | "signals"
  | "moving-average"
  | "support-resistance"
  | "fair-value"
  | "thai-summary"
  | "next-signal";

type StockDetailPreviewTabsProps = {
  data: QuoteResponse;
  onRefresh?: () => void;
  refreshing?: boolean;
};

type OverviewPreviewProps = StockDetailPreviewTabsProps;

type TabConfig = {
  id: StockDetailTab;
  label: string;
  eyebrow: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
};

const tabs: TabConfig[] = [
  { id: "overview", label: "Overview", eyebrow: "Snapshot", icon: LayoutDashboard },
  { id: "signals", label: "Signals", eyebrow: "Momentum", icon: Activity },
  { id: "moving-average", label: "Moving Average", eyebrow: "Trend system", icon: TrendingUp },
  { id: "support-resistance", label: "Support / Resistance", eyebrow: "Key zones", icon: Layers },
  { id: "fair-value", label: "Fair Value", eyebrow: "Valuation", icon: Calculator },
  { id: "thai-summary", label: "Thai Summary", eyebrow: "อ่านง่าย", icon: Languages },
  { id: "next-signal", label: "Next Signal", eyebrow: "จุดที่ควรจับตาต่อไป", icon: Radar }
];

function getThaiTrend(data: QuoteResponse): "uptrend" | "downtrend" | "sideway" {
  if (data.insight.trend === "bullish") return "uptrend";
  if (data.insight.trend === "bearish") return "downtrend";
  return "sideway";
}

function getTrendTone(data: QuoteResponse): "positive" | "negative" | "neutral" {
  if (data.insight.trend === "bullish") return "positive";
  if (data.insight.trend === "bearish") return "negative";
  return "neutral";
}

function formatPrice(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function formatNumber(value: number | undefined | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getLatestVolume(data: QuoteResponse): number | null {
  const latestCandle = data.candles.at(-1);
  return latestCandle && Number.isFinite(latestCandle.volume) ? latestCandle.volume : null;
}

function getAverageVolume(data: QuoteResponse): number | null {
  const volumes = data.candles.slice(-20).map((candle) => candle.volume).filter(Number.isFinite);
  if (volumes.length === 0) return null;
  return volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
}

function getThaiOverviewText(data: QuoteResponse): string {
  const direction = data.changePercent >= 0 ? "บวก" : "ลบ";
  const trendText = data.insight.trend === "bullish" ? "แนวโน้มยังแข็งแรง" : data.insight.trend === "bearish" ? "แนวโน้มยังอ่อนตัว" : "แนวโน้มแกว่งตัวในกรอบ";
  return `${data.symbol} วันนี้เคลื่อนไหว${direction} ${formatPercent(data.changePercent)} โดย${trendText} นักลงทุนควรดูกราฟราคา โซนแนวรับแนวต้าน และสัญญาณโมเมนตัมร่วมกันก่อนตัดสินใจ`;
}

function OverviewPreview({ data, onRefresh, refreshing = false }: OverviewPreviewProps) {
  const range = useMemo(() => {
    const closes = data.candles.map((candle) => candle.close).filter(Number.isFinite);
    if (closes.length === 0) return null;
    return {
      low: Math.min(...closes),
      high: Math.max(...closes)
    };
  }, [data.candles]);

  const latestVolume = useMemo(() => getLatestVolume(data), [data]);
  const averageVolume = useMemo(() => getAverageVolume(data), [data]);

  const overviewItems = [
    { label: "Previous close", value: formatPrice(data.previousClose) },
    { label: "Recent range", value: range ? `${formatPrice(range.low)} - ${formatPrice(range.high)}` : "—" },
    { label: "Exchange", value: data.exchange ?? "—" },
    { label: "Market time", value: data.marketTime ? new Date(data.marketTime).toLocaleString() : "—" },
    { label: "Latest volume", value: formatNumber(latestVolume) },
    { label: "20D avg volume", value: formatNumber(averageVolume) },
    { label: "Trend", value: data.insight.trend.toUpperCase() },
    { label: "Volatility", value: `${data.insight.volatility}%` }
  ];

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm tracking-widest text-slate-400">{data.symbol}</p>
          <h1 className="truncate text-3xl font-bold text-white sm:text-4xl">{data.name ?? data.symbol}</h1>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">{formatPrice(data.latestPrice)}</p>
          <p className={`mt-1 text-sm font-semibold ${data.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPercent(data.changePercent)}</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {onRefresh ? (
              <button onClick={onRefresh} className="btn-premium text-xs" disabled={refreshing} type="button">
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            ) : null}
            <FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} />
          </div>
          <span className="inline-block rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase text-slate-200">Trend: {data.insight.trend}</span>
          <p className="text-xs text-slate-300">Last updated: {new Date(data.lastUpdated).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-5 w-full max-w-full min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-2 sm:p-3">
        <PriceChart data={data} supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewItems.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 break-words text-lg font-semibold text-white">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Thai overview</p>
        <p className="mt-2 text-sm leading-7 text-slate-200">{getThaiOverviewText(data)}</p>
      </div>
    </section>
  );
}

function SignalsPanel({ data }: StockDetailPreviewTabsProps) {
  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Signals</p>
        <h2 className="mt-1 text-xl font-bold text-white">Technical signal preview</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Focused momentum, RSI, MACD, volatility, and trend readings without repeating the deeper section tools.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <InsightCard label="Trend" value={data.insight.trend.toUpperCase()} tone={getTrendTone(data)} />
        <InsightCard label="Momentum" value={data.insight.momentum.toUpperCase()} tone="neutral" />
        <InsightCard label="RSI" value={data.insight.rsiSignal.toUpperCase()} tone="neutral" />
        <InsightCard label="MACD" value={data.insight.macdSignal.toUpperCase()} tone="neutral" />
        <InsightCard label="Volatility" value={`${data.insight.volatility}%`} tone="neutral" />
      </div>
    </section>
  );
}

export function StockDetailPreviewTabs({ data, onRefresh, refreshing = false }: StockDetailPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<StockDetailTab>("overview");
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);

  const selectRelativeTab = (direction: -1 | 1) => {
    const nextIndex = (activeIndex + direction + tabs.length) % tabs.length;
    setActiveTab(tabs[nextIndex].id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      selectRelativeTab(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      selectRelativeTab(1);
    }
  };

  return (
    <section className="w-full max-w-full min-w-0 space-y-4">
      <div className="printstream-shell w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-2 sm:p-3">
        <div aria-label="Stock detail previews" className="flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                aria-selected={isActive}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-200/70 sm:px-4 ${
                  isActive
                    ? "pearl-border border-white/25 bg-white/10 text-white shadow-glass"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={handleKeyDown}
                role="tab"
                type="button"
              >
                <Icon className={isActive ? "text-cyan-100" : "text-slate-400 group-hover:text-slate-200"} size={18} />
                <span className="min-w-0">
                  <span className="block whitespace-nowrap font-semibold leading-5">{tab.label}</span>
                  <span className="block whitespace-nowrap text-[11px] leading-4 text-slate-400">{tab.eyebrow}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-full min-w-0" role="tabpanel">
        {activeTab === "overview" && <OverviewPreview data={data} onRefresh={onRefresh} refreshing={refreshing} />}
        {activeTab === "signals" && <SignalsPanel data={data} />}
        {activeTab === "moving-average" && <MovingAveragePanel movingAverages={data.movingAverages} />}
        {activeTab === "support-resistance" && (
          <SupportResistancePanel
            supports={data.supportResistance.supports}
            resistances={data.supportResistance.resistances}
            message={data.supportResistance.message}
          />
        )}
        {activeTab === "fair-value" && <FairValueCalculator symbol={data.symbol} currentPrice={data.latestPrice} metrics={data.valuationMetrics} />}
        {activeTab === "thai-summary" && (
          <ThaiStockSummary
            symbol={data.symbol}
            name={data.name}
            sector={data.sector}
            industry={data.industry}
            latestPrice={data.latestPrice}
            changePercent={data.changePercent}
            trend={getThaiTrend(data)}
            momentum={data.insight.momentum}
            rsiSignal={data.insight.rsiSignal}
            macdSignal={data.insight.macdSignal}
            volatility={data.insight.volatility}
          />
        )}
        {activeTab === "next-signal" && (
          <NextSignalPanel
            symbol={data.symbol}
            latestPrice={data.latestPrice}
            changePercent={data.changePercent}
            trend={getThaiTrend(data)}
            movingAverages={data.movingAverages}
            supportResistance={data.supportResistance}
            rsiSignal={data.insight.rsiSignal}
            macdSignal={data.insight.macdSignal}
            volume={getLatestVolume(data)}
            averageVolume={getAverageVolume(data)}
          />
        )}
      </div>
    </section>
  );
}
