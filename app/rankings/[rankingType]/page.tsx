"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import type { RankingResponse } from "@/lib/types/market";

function trendClasses(trend: string | null) {
  if (trend === "uptrend") return "border-success/25 bg-success/10 text-success";
  if (trend === "downtrend") return "border-danger/25 bg-danger/10 text-danger";
  return "border-white/[0.08] bg-white/[0.04] text-slate-500";
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
  const [result, setResult] = useState<{ ranking: string; data?: RankingResponse; failed?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  const { locale, t } = useI18n();
  const ranking = params.rankingType;
  const current = result?.ranking === ranking ? result : undefined;
  const data = current?.data;
  const loading = !current;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/rankings/${encodeURIComponent(ranking)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw Error("Ranking unavailable");
        const data = (await response.json()) as RankingResponse;
        if (!controller.signal.aborted) setResult({ ranking, data });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult((previous) => ({
          ranking, data: previous?.ranking === ranking ? previous.data : undefined, failed: true
        }));
      });
    return () => controller.abort();
  }, [ranking, attempt]);

  const title = localizedTitles[params.rankingType]?.[locale] ?? data?.title ?? params.rankingType;
  const trendLabel = (trend: string | null) => trend == null ? "—" : trend === "uptrend" ? (locale === "th" ? "ขาขึ้น" : "Uptrend") : trend === "downtrend" ? (locale === "th" ? "ขาลง" : "Downtrend") : (locale === "th" ? "ไซด์เวย์" : "Sideway");

  return (
    <PageShell size="wide" className="space-y-6">
      {loading && <LoadingSkeleton label={locale === "th" ? "กำลังโหลดอันดับหุ้น" : "Loading ranking"} />}
      {current?.failed && <ErrorState message={t("rankings.loadError")} onRetry={() => setAttempt((value) => value + 1)} />}

      {data && (
        <>
          <div>
            <p className="section-kicker">{data.source}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded-full border px-2.5 py-1 ${data.scope === "market-screener" ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning"}`}>
                {data.scope === "market-screener" ? (locale === "th" ? "ชุดคัดกรองหุ้นสหรัฐจาก Yahoo" : data.scopeLabel) : (locale === "th" ? "ชุดหุ้นคัดเลือก · ไม่ใช่ทั้งตลาด" : data.scopeLabel)}
              </span>
              <span>{locale === "th" ? "ดึงข้อมูล" : "Fetched"} {new Date(data.fetchedAt).toLocaleString(locale === "th" ? "th-TH" : "en-US")}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{locale === "th"
              ? `แสดง ${data.stocks.length} จาก ${data.candidateCount ?? data.stocks.length} รายการ`
              : `Showing ${data.stocks.length} of ${data.candidateCount ?? data.stocks.length} candidates`}
              {!!data.missingMetricCount && (locale === "th" ? ` · ขาดข้อมูล ${data.missingMetricCount} รายการ` : ` · ${data.missingMetricCount} missing the ranking metric`)}
            </p>
            {(data.stale || current?.failed) && <p className="mt-1 text-sm text-warning">{locale === "th" ? "กำลังแสดงข้อมูลล่าสุดที่มี" : "Showing the last available snapshot."}</p>}
            {data.curatedFallback && <p className="mt-1 text-sm text-warning">{locale === "th" ? "ชุดคัดกรองผู้ให้ข้อมูลไม่พร้อม" : "Provider screen unavailable."}</p>}

          </div>

          {data.stocks.length === 0 ? (
            <ErrorState message={locale === "th" ? "ไม่มีข้อมูลอันดับหุ้น" : "No ranking data available."} />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
              <div className="divide-y divide-white/[0.06]">
                {data.stocks.map((stock) => {
                  const positive = stock.changePercent != null && stock.changePercent >= 0;
                  return (
                    <div key={stock.symbol} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-5">
                      <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-slate-600">{stock.rank}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">{stock.name}</p>
                        {stock.marketTime && <p className="text-xs text-slate-400">{new Date(stock.marketTime).toLocaleString(locale === "th" ? "th-TH" : "en-US")}</p>}
                        {stock.momentumScore != null ? <p className="mt-1 text-[10px] text-slate-500">{t("stock.momentum")} {stock.momentumScore.toFixed(2)}%</p> : stock.volatility != null ? <p className="mt-1 text-[10px] text-slate-500">{locale === "th" ? "ความผันผวนรายปี (60 รอบ)" : "Annualized volatility (60 returns)"} {stock.volatility.toFixed(2)}%</p> : null}
                      </div>
                      <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${trendClasses(stock.trend)}`}>{trendLabel(stock.trend)}</span>
                      <div className="hidden shrink-0 text-right md:block"><p className="section-kicker">{locale === "th" ? "ปริมาณ" : "Vol"}</p><p className="mt-0.5 text-xs font-medium tabular-nums text-slate-400">{formatCompactNumber(stock.volume)}</p></div>
                      <div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums text-white">{formatMarketCurrency(stock.latestPrice, stock.currency ?? "")}</p><p className={`mt-0.5 text-xs font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>{stock.changePercent != null ? `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "—"}</p></div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} compact />
                        <Link href={`/stocks/${encodeURIComponent(stock.symbol)}`} className="btn-premium px-2.5 py-1.5 text-xs">{locale === "th" ? "รายละเอียด" : "Detail"}</Link>
                        <Link href={`/compare?symbols=${encodeURIComponent(stock.symbol)}`} className="btn-premium hidden px-2.5 py-1.5 text-xs sm:inline-flex">{t("nav.compare")}</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
