"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import type { RankingResponse } from "@/lib/types/market";

function formatNumber(value: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US").format(value);
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
          <SectionCard>
            <p className="section-kicker">Top 10</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">{data.title}</h1>
            <p className="mt-3 text-xs leading-5 text-slate-400">Source: {data.source} • Fetched at: {new Date(data.fetchedAt).toLocaleString()}</p>
          </SectionCard>

          {data.stocks.length === 0 ? <ErrorState message="No ranking data available." /> : (
            <section className="grid gap-4 lg:grid-cols-2">
              {data.stocks.map((stock) => {
                const positive = stock.changePercent != null && stock.changePercent >= 0;
                return (
                  <SectionCard key={stock.symbol} as="article" className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="section-kicker">#{stock.rank}</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{stock.symbol}</h2>
                        <p className="truncate text-sm text-slate-300">{stock.name}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase text-slate-300">{stock.trend}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard label="Price" value={stock.latestPrice == null ? "-" : `$${stock.latestPrice.toFixed(2)}`} />
                      <MetricCard label="Change" value={stock.changePercent == null ? "-" : `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%`} tone={positive ? "positive" : "negative"} />
                      <MetricCard label="Volume" value={formatNumber(stock.volume)} />
                      <MetricCard label="Market cap" value={formatNumber(stock.marketCap)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} />
                      <Link href={`/stocks/${stock.symbol}`} className="btn-premium w-full text-center sm:w-auto">View Detail</Link>
                      <Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium w-full text-center sm:w-auto">Add to Compare</Link>
                    </div>
                  </SectionCard>
                );
              })}
            </section>
          )}
        </>
      )}
    </PageShell>
  );
}
