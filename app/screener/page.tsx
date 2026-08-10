"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import { PageShell } from "@/components/ui/PageShell";
import { formatCompactNumber, formatMarketCurrency } from "@/lib/format/market";
import type { RankingResponse, RankingStock, RankingType } from "@/lib/types/market";

const UNIVERSES: Array<{ value: RankingType; label: string }> = [
  { value: "top-gainers", label: "US Top Gainers" },
  { value: "top-losers", label: "US Top Losers" },
  { value: "most-active", label: "US Most Active" },
  { value: "highest-market-cap", label: "US Largest Market Cap" },
  { value: "thai-stocks", label: "Thai Curated Leaders" },
  { value: "ai-tech", label: "AI / Tech Curated" },
  { value: "strongest-momentum", label: "Curated Momentum" },
  { value: "lowest-volatility", label: "Curated Low Volatility" }
];

type Filters = {
  minPrice: string;
  maxPrice: string;
  minChange: string;
  minVolume: string;
  trend: "all" | RankingStock["trend"];
};

const EMPTY_FILTERS: Filters = { minPrice: "", maxPrice: "", minChange: "", minVolume: "", trend: "all" };

function toOptionalNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function ScreenerPage() {
  const [universe, setUniverse] = useState<RankingType>("top-gainers");
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetch(`/api/rankings/${universe}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load screener universe");
        return (await response.json()) as RankingResponse;
      })
      .then(setData)
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [universe]);

  const stocks = useMemo(() => {
    const minPrice = toOptionalNumber(filters.minPrice);
    const maxPrice = toOptionalNumber(filters.maxPrice);
    const minChange = toOptionalNumber(filters.minChange);
    const minVolume = toOptionalNumber(filters.minVolume);

    return (data?.stocks ?? []).filter((stock) => {
      if (minPrice != null && (stock.latestPrice == null || stock.latestPrice < minPrice)) return false;
      if (maxPrice != null && (stock.latestPrice == null || stock.latestPrice > maxPrice)) return false;
      if (minChange != null && (stock.changePercent == null || stock.changePercent < minChange)) return false;
      if (minVolume != null && (stock.volume == null || stock.volume < minVolume)) return false;
      if (filters.trend !== "all" && stock.trend !== filters.trend) return false;
      return true;
    });
  }, [data, filters]);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    setFilters(draft);
  };

  return (
    <PageShell size="wide" className="space-y-6">
      <div>
        <p className="section-kicker">Stock screener</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Filter a verified market universe</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
          This first production screener filters live ranking universes. Yahoo predefined market screeners are market-wide where available; curated categories are clearly labeled and never presented as full-exchange coverage.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 lg:grid-cols-[1.2fr_3fr]">
        <label className="space-y-1.5 text-xs text-slate-500">
          Universe
          <select value={universe} onChange={(event) => setUniverse(event.target.value as RankingType)} className="block w-full rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none">
            {UNIVERSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <form onSubmit={applyFilters} className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <input value={draft.minPrice} onChange={(e) => setDraft((current) => ({ ...current, minPrice: e.target.value }))} type="number" step="any" placeholder="Min price" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
          <input value={draft.maxPrice} onChange={(e) => setDraft((current) => ({ ...current, maxPrice: e.target.value }))} type="number" step="any" placeholder="Max price" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
          <input value={draft.minChange} onChange={(e) => setDraft((current) => ({ ...current, minChange: e.target.value }))} type="number" step="any" placeholder="Min change %" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
          <input value={draft.minVolume} onChange={(e) => setDraft((current) => ({ ...current, minVolume: e.target.value }))} type="number" step="1" placeholder="Min volume" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
          <select value={draft.trend} onChange={(e) => setDraft((current) => ({ ...current, trend: e.target.value as Filters["trend"] }))} className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none">
            <option value="all">All trends</option>
            <option value="uptrend">Uptrend</option>
            <option value="sideway">Sideway</option>
            <option value="downtrend">Downtrend</option>
          </select>
          <button type="submit" className="btn-primary justify-center">Apply</button>
        </form>
      </div>

      {data ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className={`rounded-full border px-2.5 py-1 ${data.scope === "market-screener" ? "border-success/25 bg-success/10 text-success" : "border-warning/25 bg-warning/10 text-warning"}`}>{data.scopeLabel}</span>
          <span>{stocks.length} of {data.stocks.length} candidates match</span>
        </div>
      ) : null}

      {loading ? <div className="rounded-2xl border border-white/[0.08] bg-surface p-8 text-center text-sm text-slate-500">Loading screener…</div> : null}
      {error ? <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{error}</div> : null}

      {!loading && !error ? (
        stocks.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-surface p-8 text-center text-sm text-slate-500">No stocks match the current filters.</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
            <div className="divide-y divide-white/[0.06]">
              {stocks.map((stock) => {
                const positive = (stock.changePercent ?? 0) >= 0;
                return (
                  <div key={stock.symbol} className="grid gap-3 px-4 py-4 sm:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto] sm:items-center">
                    <div className="min-w-0">
                      <Link href={`/stocks/${stock.symbol}`} className="font-semibold text-white hover:text-accent">{stock.symbol}</Link>
                      <p className="mt-1 truncate text-xs text-slate-600">{stock.name}</p>
                    </div>
                    <div><p className="section-kicker">Price</p><p className="mt-1 text-sm text-slate-300">{formatMarketCurrency(stock.latestPrice, stock.currency ?? "USD")}</p></div>
                    <div><p className="section-kicker">Change</p><p className={`mt-1 text-sm font-semibold ${positive ? "text-success" : "text-danger"}`}>{stock.changePercent == null ? "—" : `${positive ? "+" : ""}${stock.changePercent.toFixed(2)}%`}</p></div>
                    <div><p className="section-kicker">Volume</p><p className="mt-1 text-sm text-slate-300">{formatCompactNumber(stock.volume)}</p></div>
                    <div className="flex gap-2"><FavoriteButton compact stock={{ symbol: stock.symbol, name: stock.name, price: stock.latestPrice ?? undefined, changePercent: stock.changePercent ?? undefined }} /><Link href={`/compare?symbols=${stock.symbol}`} className="btn-premium text-xs">Compare</Link></div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}
    </PageShell>
  );
}
