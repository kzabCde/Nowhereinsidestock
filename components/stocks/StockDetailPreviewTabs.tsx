"use client";

import { useMemo, useState, type ComponentType, type KeyboardEvent, type SVGProps } from "react";
import { Activity, Calculator, Layers, LayoutDashboard, Radar, TrendingUp } from "lucide-react";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { PriceChart } from "@/components/dashboard/PriceChart";
import { BacktestPanel } from "@/components/stocks/BacktestPanel";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { MovingAveragePanel } from "@/components/stocks/MovingAveragePanel";
import { NextSignalPanel } from "@/components/stocks/NextSignalPanel";
import { SupportResistancePanel } from "@/components/stocks/SupportResistancePanel";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { TabButton } from "@/components/ui/TabButton";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import { macdLabel, momentumLabel, rsiLabel, trendLabel } from "@/lib/i18n/market-labels";
import type { MessageKey } from "@/lib/i18n/messages";
import type { QuoteResponse } from "@/lib/types/market";

export type StockDetailTab = "overview" | "signals" | "moving-average" | "support-resistance" | "fair-value" | "backtest" | "next-signal";
type StockDetailPreviewTabsProps = { data: QuoteResponse; onRefresh?: () => void; refreshing?: boolean };
type TabConfig = { id: StockDetailTab; label: MessageKey; eyebrow: MessageKey; icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }> };

const tabs: TabConfig[] = [
  { id: "overview", label: "stock.overview", eyebrow: "stock.snapshot", icon: LayoutDashboard },
  { id: "signals", label: "stock.signals", eyebrow: "stock.momentum", icon: Activity },
  { id: "moving-average", label: "stock.movingAverage", eyebrow: "stock.trendSystem", icon: TrendingUp },
  { id: "support-resistance", label: "stock.supportResistance", eyebrow: "stock.keyZones", icon: Layers },
  { id: "fair-value", label: "stock.fairValue", eyebrow: "stock.valuation", icon: Calculator },
  { id: "backtest", label: "stock.backtest", eyebrow: "stock.historicalTest", icon: TrendingUp },
  { id: "next-signal", label: "stock.nextSignal", eyebrow: "stock.watchNext", icon: Radar }
];

function getTechnicalTrend(data: QuoteResponse): "uptrend" | "downtrend" | "sideway" {
  if (data.insight.trend === "bullish") return "uptrend";
  if (data.insight.trend === "bearish") return "downtrend";
  return "sideway";
}
function getTrendTone(data: QuoteResponse): "positive" | "negative" | "neutral" {
  if (data.insight.trend === "bullish") return "positive";
  if (data.insight.trend === "bearish") return "negative";
  return "neutral";
}
function formatNumber(value: number | undefined | null, locale: string): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", { maximumFractionDigits: 0 }).format(value);
}
function formatPercent(value: number): string { return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`; }
function getLatestVolume(data: QuoteResponse): number | null {
  const latestCandle = data.candles.at(-1);
  return latestCandle && Number.isFinite(latestCandle.volume) ? latestCandle.volume : null;
}
function getAverageVolume(data: QuoteResponse): number | null {
  const volumes = data.candles.slice(-20).map((candle) => candle.volume).filter(Number.isFinite);
  return volumes.length === 0 ? null : volumes.reduce((sum, volume) => sum + volume, 0) / volumes.length;
}

function OverviewPreview({ data, onRefresh, refreshing = false }: StockDetailPreviewTabsProps) {
  const { locale, t } = useI18n();
  const range = useMemo(() => {
    const closes = data.candles.map((candle) => candle.close).filter(Number.isFinite);
    return closes.length === 0 ? null : { low: Math.min(...closes), high: Math.max(...closes) };
  }, [data.candles]);
  const latestVolume = useMemo(() => getLatestVolume(data), [data]);
  const averageVolume = useMemo(() => getAverageVolume(data), [data]);
  const currency = data.currency ?? "USD";
  const positive = data.changePercent >= 0;
  const trendKey = data.insight.trend === "bullish" ? "stock.trendBullish" : data.insight.trend === "bearish" ? "stock.trendBearish" : "stock.trendSideways";
  const directionKey = positive ? "stock.directionPositive" : "stock.directionNegative";
  const overviewItems = [
    { label: t("common.previousClose"), value: formatMarketCurrency(data.previousClose, currency) },
    { label: t("stock.range"), value: range ? `${formatMarketCurrency(range.low, currency)} – ${formatMarketCurrency(range.high, currency)}` : "—" },
    { label: t("common.exchange"), value: data.exchange ?? "—" },
    { label: t("common.currency"), value: currency },
    { label: t("common.marketTime"), value: data.marketTime ? new Date(data.marketTime).toLocaleString(locale === "th" ? "th-TH" : "en-US") : "—" },
    { label: t("stock.latestVolume"), value: formatNumber(latestVolume, locale) },
    { label: t("stock.avgVolume"), value: formatNumber(averageVolume, locale) },
    { label: t("common.trend"), value: trendLabel(locale, data.insight.trend) },
    { label: t("common.volatility"), value: `${data.insight.volatility}% annualized` }
  ];

  return (
    <SectionCard className="w-full space-y-5 sm:p-7">
      <div className="relative z-[1] grid gap-5 border-b border-white/[0.055] pb-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><span className="badge-neutral">{data.symbol}</span><span className="section-kicker">{data.exchange ?? "—"}</span></div>
          <h1 className="mt-3 truncate text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">{data.name ?? data.symbol}</h1>
          <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2"><p className="text-4xl font-semibold tabular-nums tracking-[-0.055em] text-white sm:text-5xl">{formatMarketCurrency(data.latestPrice, currency)}</p><p className={`mb-1 text-base font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{formatPercent(data.changePercent)}</p></div>
          <p className="mt-3 text-xs text-slate-600">{t("common.updated", { time: new Date(data.lastUpdated).toLocaleTimeString(locale === "th" ? "th-TH" : "en-US") })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
          <span className={data.insight.trend === "bullish" ? "badge-positive" : data.insight.trend === "bearish" ? "badge-negative" : "badge-neutral"}>{trendLabel(locale, data.insight.trend)}</span>
          <div className="flex gap-2">{onRefresh ? <button onClick={onRefresh} className="btn-premium text-xs" disabled={refreshing} type="button">{refreshing ? t("common.refreshing") : t("common.refresh")}</button> : null}<FavoriteButton stock={{ symbol: data.symbol, name: data.name, exchange: data.exchange, price: data.latestPrice, changePercent: data.changePercent }} /></div>
        </div>
      </div>
      <div className="relative z-[1] w-full overflow-hidden rounded-2xl border border-white/[0.065] bg-[#080e1b]/75 p-2 sm:p-3"><PriceChart data={data} supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} /></div>
      <div className="relative z-[1] grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{overviewItems.map((item) => <MetricCard key={item.label} label={item.label} value={item.value} />)}</div>
      <div className="relative z-[1] rounded-2xl border border-white/[0.06] bg-white/[0.018] p-4 sm:p-5"><div className="flex items-center gap-2"><span className="signal-dot" aria-hidden="true" /><p className="section-kicker">{t("stock.technicalOverview")}</p></div><p className="mt-3 text-sm leading-7 text-slate-400">{t("stock.technicalOverviewText", { symbol: data.symbol, direction: t(directionKey), change: formatPercent(data.changePercent), trend: t(trendKey) })}</p></div>
    </SectionCard>
  );
}

function SignalsPanel({ data }: StockDetailPreviewTabsProps) {
  const { locale, t } = useI18n();
  return (
    <SectionCard className="w-full space-y-5 sm:p-7">
      <div className="relative z-[1] border-b border-white/[0.055] pb-4"><p className="section-kicker">{t("stock.signals")}</p><h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-white">{t("stock.indicatorsTitle")}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{t("stock.indicatorsDesc")}</p></div>
      <div className="relative z-[1] grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <InsightCard label={t("common.trend")} value={trendLabel(locale, data.insight.trend)} tone={getTrendTone(data)} />
        <InsightCard label={t("stock.momentum")} value={momentumLabel(locale, data.insight.momentum)} tone="neutral" />
        <InsightCard label={t("stock.momentumScore")} value={`${data.insight.momentumScore.toFixed(2)}%`} tone="neutral" />
        <InsightCard label={t("stock.rsi")} value={rsiLabel(locale, data.insight.rsiSignal)} tone="neutral" />
        <InsightCard label={t("stock.macd")} value={macdLabel(locale, data.insight.macdSignal)} tone="neutral" />
        <InsightCard label={t("common.volatility")} value={`${data.insight.volatility}%`} tone="neutral" />
      </div>
    </SectionCard>
  );
}

export function StockDetailPreviewTabs({ data, onRefresh, refreshing = false }: StockDetailPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<StockDetailTab>("overview");
  const { t } = useI18n();
  const activeIndex = tabs.findIndex((tab) => tab.id === activeTab);
  const selectRelativeTab = (direction: -1 | 1) => setActiveTab(tabs[(activeIndex + direction + tabs.length) % tabs.length].id);
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); selectRelativeTab(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); selectRelativeTab(1); }
  };
  return (
    <section className="w-full max-w-full min-w-0 space-y-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#09101f]/90 p-1.5 shadow-card backdrop-blur-xl md:sticky md:top-[76px] md:z-20">
        <div className="relative">
          <div aria-label={t("stock.overview")} className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap" role="tablist">
            {tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.id; return <TabButton active={isActive} aria-selected={isActive} eyebrow={t(tab.eyebrow)} icon={<Icon size={15} />} key={tab.id} onClick={() => setActiveTab(tab.id)} onKeyDown={handleKeyDown} role="tab" type="button">{t(tab.label)}</TabButton>; })}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#09101f] to-transparent sm:hidden" aria-hidden="true" />
        </div>
      </div>
      <div className="w-full max-w-full min-w-0" role="tabpanel">
        {activeTab === "overview" && <OverviewPreview data={data} onRefresh={onRefresh} refreshing={refreshing} />}
        {activeTab === "signals" && <SignalsPanel data={data} />}
        {activeTab === "moving-average" && <MovingAveragePanel movingAverages={data.movingAverages} />}
        {activeTab === "support-resistance" && <SupportResistancePanel supports={data.supportResistance.supports} resistances={data.supportResistance.resistances} />}
        {activeTab === "fair-value" && <FairValueCalculator symbol={data.symbol} currentPrice={data.latestPrice} metrics={data.valuationMetrics} currency={data.currency} />}
        {activeTab === "backtest" && <BacktestPanel candles={data.candles} currency={data.currency} />}
        {activeTab === "next-signal" && <NextSignalPanel symbol={data.symbol} latestPrice={data.latestPrice} currency={data.currency} changePercent={data.changePercent} trend={getTechnicalTrend(data)} movingAverages={data.movingAverages} supportResistance={data.supportResistance} rsiSignal={data.insight.rsiSignal} macdSignal={data.insight.macdSignal} momentumScore={data.insight.momentumScore} volume={getLatestVolume(data)} averageVolume={getAverageVolume(data)} />}
      </div>
    </section>
  );
}
