"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import type { RankingResponse } from "@/lib/types/market";

function formatCompact(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

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
          {/* Header */}
          <div>
            <p className="section-kicker">Top 10 · {data.source}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{data.title}</h1>
            <p className="mt-1 text-xs text-slate-600">
              Fetched {new Date(data.fetchedAt).toLocaleString()}
            </p>
          </div>

          {/* Ranked list */}
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
                      {/* Rank */}
                      <span className="w-6 shrink-0 text-center text-xs font-bold tabular-nums text-slate-600">
                        {stock.rank}
                      </span>

                      {/* Symbol + Name */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-600">{stock.name}</p>
                      </div>

                      {/* Trend badge — sm+ */}
                      <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider sm:inline-flex ${trendClasses(stock.trend)}`}>
                        {stock.trend}
                      </span>

                      {/* Volume — md+ */}
                      <div className="hidden shrink-0 text-right md:block">
                        <p className="section-kicker">Vol</p>
                        <p className="mt-0.5 text-xs font-medium tabular-nums text-slate-400">{formatCompact(stock.volume)}</p>
                      </div>

                      {/* Price + Change */}
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-white">
                          {stock.latestPrice != null ? `$${stock.latestPrice.toFixed(2)}` : "—"}
                        </p>
                        <p className={`mt-0.5 text-xs font-semibold tabular-nums ${positive ? "text-success" : "text-danger"}`}>
                          {stock.changePercent != null
                            ? `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%`
                            : "—"}
                        </p>
                      </div>

                      {/* Actions */}
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
