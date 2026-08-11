"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import type { RankingResponse } from "@/lib/types/market";

function trendClasses(trend: string) {
  if (trend === "uptrend") return "badge-positive";
  if (trend === "downtrend") return "badge-negative";
  return "badge-neutral";
}

const localizedTitles: Record<string, { en: string; th: string }> = {
  "top-gainers": { en: "Top Gainers", th: "หุ้นขึ้นสูงสุด" },
  "top-losers": { en: "Top Losers", th: "หุ้นลงสูงสุด" },
  "most-active": { en: "Most Active", th: "ซื้อขายคึกคักที่สุด" },
  "highest-market-cap": { en: "Highest Market Cap", th: "มูลค่าตลาดสูงสุด" },
  "highest-volume": { en: "Highest Volume", th: "ปริมาณซื้อขายสูงสุด" },
  "strongest-momentum": { en: "Strongest Momentum", th: "โมเมนตัมแข็งแรงที่สุด" },
  "lowest-volatility": { en: "Lowest Volatility", th: "ความผันผวนต่ำสุด" },
  "magnificent-seven": { en: "Magnificent Seven", th: "Magnificent Seven" },
  "thai-stocks": { en: "Thai Stocks", th: "หุ้นไทย" },
  "ai-tech": { en: "AI / Tech", th: "AI / Tech" }
};

export default function RankingDetailPage() {
  const params = useParams<{ rankingType: string }>();
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { locale, t } = useI18n();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/rankings/${params.rankingType}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(t("rankings.loadError"));
        return (await res.json()) as RankingResponse;
      })
      .then((json) => setData(json))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [params.rankingType, t]);

  const title = localizedTitles[params.rankingType]?.[locale] ?? data?.title ?? params.rankingType;
  const trendLabel = (trend: string) => trend === "uptrend" ? (locale === "th" ? "ขาขึ้น" : "Uptrend") : trend === "downtrend" ? (locale === "th" ? "ขาลง" : "Downtrend") : (locale === "th" ? "ไซด์เวย์" : "Sideway");

  return (
    <PageShell size="wide" className="space-y-6">
      {loading && <LoadingSkeleton label={locale === "th" ? "กำลังโหลดอันดับหุ้น" : "Loading ranking"} />}
      {error && <ErrorState message={error} />}

      {!loading && !error && data && (
        <>
          <PageHeader
            eyebrow={`Top 10 · ${data.source}`}
            title={title}
            description={data.scope === "curated-universe" ? (locale === "th" ? "อันดับนี้คำนวณภายในชุดหลักทรัพย์ที่คัดเลือกไว้ และระบุขอบเขตอย่างชัดเจนเพื่อไม่ให้เข้าใจว่าเป็นหุ้นทั้งตลาด" : "This ranking is calculated inside a curated symbol universe with scope shown explicitly rather than presented as full-market coverage.") : (locale === "th" ? "อันดับจาก market screener ของผู้ให้บริการ พร้อมเวลาอัปเดตและขอบเขตแหล่งข้อมูล" : "Provider market-screener ranking with source scope and fetch time shown transparently.")}
            meta={<span className={data.scope === "market-screener" ? "badge-positive" : "badge border-warning/25 bg-warning/10 text-warning"}>{data.scope === "market-screener" ? (locale === "th" ? "Market screener" : data.scopeLabel) : (locale === "th" ? "Curated universe" : data.scopeLabel)}</span>}
            actions={<span className="text-xs text-slate-600">{locale === "th" ? "ดึงข้อมูล" : "Fetched"} {new Date(data.fetchedAt).toLocaleString(locale === "th" ? "th-TH" : "en-US")}</span>}
          />

          {data.stocks.length === 0 ? (
            <ErrorState message={locale === "th" ? "ไม่มีข้อมูลอันดับหุ้น" : "No ranking data available."} />
          ) : (
            <section className="table-shell">
              <div className="hidden grid-cols-[42px_1.4fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-white/[0.055] bg-white/[0.018] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:grid sm:px-5">
                <span>#</span><span>{locale === "th" ? "หลักทรัพย์" : "Security"}</span><span>{locale === "th" ? "แนวโน้ม" : "Trend"}</span><span>{locale === "th" ? "ปริมาณ" : "Volume"}</span><span>{t("common.price")}</span><span>{locale === "th" ? "การทำงาน" : "Actions"}</span>
              </div>
              <div className="divide-y divide-white/[0.055]">
                {data.stocks.map((stock) => {
                  const positive = stock.changePercent != null && stock.changePercent >= 0;
                  return (
                    <div key={stock.symbol} className="table-row grid gap-3 px-4 py-4 sm:grid-cols-[42px_1.4fr_0.8fr_0.8fr_0.8fr_auto] sm:items-center sm:px-5">
                      <span className="hidden text-center text-xs font-semibold tabular-nums text-slate-700 sm:block">{String(stock.rank).padStart(2, "0")}</span>
                      <div className="min-w-0"><div className="flex items-center gap-2 sm:hidden"><span className="text-[10px] font-semibold text-slate-700">#{stock.rank}</span><span className={trendClasses(stock.trend)}>{trendLabel(stock.trend)}</span></div><Link href={`/stocks/${stock.symbol}`} className="mt-1 block text-sm font-semibold text-white transition-colors hover:text-accent sm:mt-0">{stock.symbol}</Link><p className="mt-0.5 truncate text-xs text-slate-600">{stock.name}</p>{stock.momentumScore != null ? <p className="mt-1 text-[10px] text-slate-500">{t("stock.momentum")} {stock.momentumScore.toFixed(2)}%</p> : stock.volatility != null ? <p className="mt-1 text-[10px] text-slate-500">{locale === "th" ? "ความผันผวน annualized" : "Annualized volatility"} {stock.volatility.toFixed(2)}%</p> : null}</div>
                      <span className={`hidden w-fit sm:inline-flex ${trendClasses(stock.trend)}`}>{trendLabel(stock.trend)}</span>
                      <div className="hidden sm:block"><p className="text-xs font-medium tabular-nums text-slate-400">{formatCompactNumber(stock.volume)}</p></div>
                      <div><p className="section-kicker sm:hidden">{t("common.price")}</p><p className="mt-1 text-sm font-semibold tabular-nums text-white sm:mt-0">{formatMarketCurrency(stock.latestPrice, stock.currency ?? "USD")}</p><p className={`mt-0.5 text-xs font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{stock.changePercent != null ? `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "—"}</p></div>
                      <div className="flex items-center gap-1.5"><FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} compact /><Link href={`/stocks/${stock.symbol}`} className="btn-premium px-2.5 text-xs">{locale === "th" ? "รายละเอียด" : "Detail"}</Link><Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium hidden px-2.5 text-xs lg:inline-flex">{t("nav.compare")}</Link></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
