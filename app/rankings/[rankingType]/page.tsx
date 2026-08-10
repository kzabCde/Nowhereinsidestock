"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import type { RankingResponse } from "@/lib/types/market";

function trendClasses(trend: string) {
  if (trend === "uptrend") return "border-success/25 bg-success/10 text-success";
  if (trend === "downtrend") return "border-danger/25 bg-danger/10 text-danger";
  return "border-white/[0.08] bg-white/[0.04] text-slate-500";
}

export default function RankingDetailPage() {
  const params = useParams<{ rankingType: string }>();
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/rankings/${params.rankingType}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unable to load ranking");
        return (await res.json()) as RankingResponse;
      })
      .then((json) => setData(json))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [params.rankingType]);

  return (
    <PageShell size="wide" className="space-y-6">
      {loading && <LoadingSkeleton label="Loading ranking" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && data && (
        <>
          <div>
            <p className="section-kicker">Top 10 · {data.source}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{data.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className={`rounded-full border px-2.5 py-1 ${data.scope === "market-screener" ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning"}`}>
                {data.scopeLabel}
              </span>
              <span>Fetched {new Date(data.fetchedAt).toLocaleString()}</span>
            </div>
            {data.scope === "curated-universe" ? (
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
                This category is ranked within a curated symbol universe rather than the entire market. The scope is shown explicitly to avoid overstating coverage.
              </p>
            ) : null}
          </div>

          {data.stocks.length === 0 ? (
            <ErrorState message="No ranking data available." />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
              <div className="divide-y divide-white/[0.06]">
                {data.stocks.map((stock) => {
                  const positive = stock.changePercent != null && stock.changePercent >= 0;
                  return (
                    <div
                      key={stock.symbol}
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-5"
                    >
                      <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-slate-600">{stock.rank}</span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-600">{stock.name}</p>
                        {stock.momentumScore != null ? (
                          <p className="mt-1 text-[10px] text-slate-500">Momentum {stock.momentumScore.toFixed(2)}%</p>
                        ) : stock.volatility != null ? (
                          <p className="mt-1 text-[10px] text-slate-500">Annualized volatility {stock.volatility.toFixed(2)}%</p>
                        ) : null}
                      </div>

                      <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${trendClasses(stock.trend)}`}>
                        {stock.trend}
                      </span>

                      <div className="hidden shrink-0 text-right md:block">
                        <p className="section-kicker">Vol</p>
                        <p className="mt-0.5 text-xs font-medium tabular-nums text-slate-400">{formatCompactNumber(stock.volume)}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-white">
                          {formatMarketCurrency(stock.latestPrice, stock.currency ?? "USD")}
                        </p>
                        <p className={`mt-0.5 text-xs font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
                          {stock.changePercent != null ? `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "—"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <FavoriteButton
                          stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }}
                          compact
                        />
                        <Link href={`/stocks/${stock.symbol}`} className="btn-premium px-2.5 py-1.5 text-xs">
                          Detail
                        </Link>
                        <Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium hidden px-2.5 py-1.5 text-xs sm:inline-flex">
                          Compare
                        </Link>
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
