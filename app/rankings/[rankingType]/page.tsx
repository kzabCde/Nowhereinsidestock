"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
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
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <Link href="/rankings" className="btn-premium inline-flex">← Back to Rankings</Link>
        {loading && <section className="printstream-shell rounded-2xl p-6 text-slate-200">Loading ranking...</section>}
        {error && <section className="printstream-shell rounded-2xl p-6 text-rose-300">{error}</section>}
        {!loading && !error && data && (
          <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
            <h1 className="text-2xl font-bold sm:text-3xl">{data.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Source: {data.source} • Fetched at: {new Date(data.fetchedAt).toLocaleString()}</p>
            {data.stocks.length === 0 ? <p className="mt-4 text-slate-300">No ranking data available.</p> : (
              <div className="mt-4 space-y-3">
                {data.stocks.map((stock) => (
                  <article key={stock.symbol} className="rounded-2xl border border-white/15 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-lg font-semibold">#{stock.rank} {stock.symbol}</p>
                      <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs uppercase">{stock.trend}</span>
                    </div>
                    <p className="text-sm text-slate-300">{stock.name}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
                      <p>Price: {stock.latestPrice == null ? "-" : `$${stock.latestPrice.toFixed(2)}`}</p>
                      <p className={stock.changePercent != null && stock.changePercent >= 0 ? "text-emerald-300" : "text-rose-300"}>Change: {stock.changePercent == null ? "-" : `${stock.changePercent.toFixed(2)}%`}</p>
                      <p>Vol: {formatNumber(stock.volume)}</p>
                      <p>Mkt Cap: {formatNumber(stock.marketCap)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <FavoriteButton stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} />
                      <Link href={`/stocks/${stock.symbol}`} className="btn-premium">View Detail</Link>
                      <Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium">Add to Compare</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
