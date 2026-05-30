"use client";

import { useMemo, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { Activity, Calculator, Languages, Layers, LayoutDashboard, LineChart, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";
import { MovingAveragePanel } from "@/components/stocks/MovingAveragePanel";
import { SupportResistancePanel } from "@/components/stocks/SupportResistancePanel";
import { ThaiStockSummary } from "@/components/stocks/ThaiStockSummary";
import type { QuoteResponse } from "@/lib/types/market";

export type StockDetailTab =
  | "overview"
  | "chart"
  | "signals"
  | "moving-average"
  | "support-resistance"
  | "fair-value"
  | "thai-summary";

type StockDetailPreviewTabsProps = {
  data: QuoteResponse;
};

type TabConfig = {
  id: StockDetailTab;
  label: string;
  eyebrow: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;
};

const tabs: TabConfig[] = [
  { id: "overview", label: "Overview", eyebrow: "Snapshot", icon: LayoutDashboard },
  { id: "chart", label: "Chart", eyebrow: "Price action", icon: LineChart },
  { id: "signals", label: "Signals", eyebrow: "Momentum", icon: Activity },
  { id: "moving-average", label: "Moving Average", eyebrow: "Trend system", icon: TrendingUp },
  { id: "support-resistance", label: "Support / Resistance", eyebrow: "Key zones", icon: Layers },
  { id: "fair-value", label: "Fair Value", eyebrow: "Valuation", icon: Calculator },
  { id: "thai-summary", label: "Thai Summary", eyebrow: "อ่านง่าย", icon: Languages }
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

function formatPrice(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
}

function OverviewPreview({ data }: StockDetailPreviewTabsProps) {
  const range = useMemo(() => {
    const closes = data.candles.map((candle) => candle.close).filter(Number.isFinite);
    if (closes.length === 0) return null;
    return {
      low: Math.min(...closes),
      high: Math.max(...closes)
    };
  }, [data.candles]);

  const overviewItems = [
    { label: "Previous close", value: formatPrice(data.previousClose) },
    { label: "Recent range", value: range ? `${formatPrice(range.low)} - ${formatPrice(range.high)}` : "—" },
    { label: "Exchange", value: data.exchange ?? "—" },
    { label: "Market time", value: data.marketTime ? new Date(data.marketTime).toLocaleString() : "—" }
  ];

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overview</p>
          <h2 className="mt-1 text-xl font-bold text-white">{data.symbol} market snapshot</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            A compact stock detail preview with price context, market metadata, and the latest updated quote.
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${data.changePercent >= 0 ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100" : "border-rose-300/30 bg-rose-400/10 text-rose-100"}`}>
          {data.changePercent >= 0 ? "+" : ""}{data.changePercent.toFixed(2)}% today
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewItems.map((item) => (
          <article key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className="mt-2 break-words text-lg font-semibold text-white">{item.value}</p>
          </article>
        ))}
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

export function StockDetailPreviewTabs({ data }: StockDetailPreviewTabsProps) {
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
        {activeTab === "overview" && <OverviewPreview data={data} />}
        {activeTab === "chart" && (
          <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-3 sm:p-4">
            <PriceChart data={data} supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} />
          </section>
        )}
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
      </div>
    </section>
  );
}
