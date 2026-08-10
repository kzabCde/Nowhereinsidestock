"use client";

import { useMemo, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { Activity, Calculator, Languages, Layers, LayoutDashboard, Radar, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { MovingAveragePanel } from "@/components/stocks/MovingAveragePanel";
import { NextSignalPanel } from "@/components/stocks/NextSignalPanel";
import { SupportResistancePanel } from "@/components/stocks/SupportResistancePanel";
import { ThaiStockSummary } from "@/components/stocks/ThaiStockSummary";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TabButton } from "@/components/ui/TabButton";
import { formatMarketCurrency } from "@/lib/format/market";
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
    return { low: Math.min(...closes), high: Math.max(...closes) };
  }, [data.candles]);

  const latestVolume = useMemo(() => getLatestVolume(data), [data]);
  const averageVolume = useMemo(() => getAverageVolume(data), [data]);
  const currency = data.currency ?? "USD";
  const positive = data.changePercent >= 0;

  const overviewItems = [
    { label: "Previous close", value: formatMarketCurrency(data.previousClose, currency) },
    { label: "Range (period)", value: range ? `${formatMarketCurrency(range.low, currency)} – ${formatMarketCurrency(range.high, currency)}` : "—" },
    { label: "Exchange", value: data.exchange ?? "—" },
    { label: "Currency", value: currency },
    { label: "Market time", value: data.marketTime ? new Date(data.marketTime).toLocaleString() : "—" },
    { label: "Latest volume", value: formatNumber(latestVolume) },
    { label: "20D avg volume", value: formatNumber(averageVolume) },
    { label: "Trend", value: data.insight.trend.toUpperCase() },
    { label: "Volatility", value: `${data.insight.volatility}% annualized` }
  ];

  return (
    <SectionCard className="w-full space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="section-kicker">{data.symbol} · {data.exchange ?? "—"}</p>
          <h1 className="mt-1.5 truncate text-2xl font-bold text-white sm:text-3xl">{data.name ?? data.symbol}</h1>
          <div className="mt-3 flex items-baseline gap-3">
            <p className="text-3xl font-bold tabular-nums text-white sm:text-4xl">{formatMarketCurrency(data.latestPrice, currency)}</p>
            <p className={`text-base font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{formatPercent(data.changePercent)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex gap-2">
            {onRefresh ? (
              <button onClick={onRefresh} className="btn-premium text-xs" disabled={refreshing} type="button">
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            ) : null}
            <FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} />
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            data.insight.trend === "bullish" ? "border-success/25 bg-success/10 text-success" :
            data.insight.trend === "bearish" ? "border-danger/25 bg-danger/10 text-danger" :
            "border-white/[0.08] bg-white/[0.04] text-slate-400"
          }`}>
            {data.insight.trend}
          </span>
          <p className="text-xs text-slate-600">Updated {new Date(data.lastUpdated).toLocaleTimeString()}</p>
        </div>
      </div>

      <div className="w-full overflow-hidden rounded-xl border border-white/[0.08] bg-elevated p-2 sm:p-3">
        <PriceChart data={data} supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {overviewItems.map((item) => <MetricCard key={item.label} label={item.label} value={item.value} />)}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-elevated p-4">
        <p className="section-kicker">ภาพรวมภาษาไทย</p>
        <p className="mt-2 text-sm leading-7 text-slate-300">{getThaiOverviewText(data)}</p>
      </div>
    </SectionCard>
  );
}

function SignalsPanel({ data }: StockDetailPreviewTabsProps) {
  return (
    <SectionCard className="w-full space-y-5">
      <div>
        <p className="section-kicker">Technical Signals</p>
        <h2 className="mt-1.5 text-xl font-bold text-white">Momentum & Indicators</h2>
        <p className="mt-1.5 text-sm text-slate-500">RSI, MACD, normalized momentum, trend, and annualized return volatility.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <InsightCard label="Trend" value={data.insight.trend.toUpperCase()} tone={getTrendTone(data)} />
        <InsightCard label="Momentum" value={data.insight.momentum.toUpperCase()} tone="neutral" />
        <InsightCard label="Momentum score" value={`${data.insight.momentumScore.toFixed(2)}%`} tone="neutral" />
        <InsightCard label="RSI" value={data.insight.rsiSignal.toUpperCase()} tone="neutral" />
        <InsightCard label="MACD" value={data.insight.macdSignal.toUpperCase()} tone="neutral" />
        <InsightCard label="Volatility" value={`${data.insight.volatility}%`} tone="neutral" />
      </div>
    </SectionCard>
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
    <section className="w-full max-w-full min-w-0 space-y-3">
      <div className="rounded-xl border border-white/[0.08] bg-surface p-1.5">
        <div className="relative">
          <div aria-label="Stock detail sections" className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TabButton
                  active={isActive}
                  aria-selected={isActive}
                  eyebrow={tab.eyebrow}
                  icon={<Icon size={15} />}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={handleKeyDown}
                  role="tab"
                  type="button"
                >
                  {tab.label}
                </TabButton>
              );
            })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent sm:hidden" aria-hidden="true" />
        </div>
      </div>

      <div className="w-full max-w-full min-w-0" role="tabpanel">
        {activeTab === "overview" && <OverviewPreview data={data} onRefresh={onRefresh} refreshing={refreshing} />}
        {activeTab === "signals" && <SignalsPanel data={data} />}
        {activeTab === "moving-average" && <MovingAveragePanel movingAverages={data.movingAverages} />}
        {activeTab === "support-resistance" && (
          <SupportResistancePanel supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} message={data.supportResistance.message} />
        )}
        {activeTab === "fair-value" && (
          <FairValueCalculator symbol={data.symbol} currentPrice={data.latestPrice} metrics={data.valuationMetrics} currency={data.currency} />
        )}
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
