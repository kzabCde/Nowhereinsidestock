"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import type { SearchItem } from "@/lib/types/market";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 350);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (debounced.length < 2) return setResults([]);
    void (async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`);
      if (res.ok) setResults((await res.json()) as SearchItem[]);
    })();
  }, [debounced]);

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="printstream-shell pearl-border glow-soft w-full max-w-full rounded-3xl p-4 text-center sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">NowhereInsideStock</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">See the trend. Read the signal.</p>
          <form className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row" action="/stocks" onSubmit={(e) => e.preventDefault()}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="h-14 w-full min-w-0 flex-1 rounded-2xl border border-white/20 bg-black/50 px-4 text-base uppercase outline-none focus:border-cyan-300 sm:px-5 sm:text-lg"
              placeholder="Search stock symbol..."
            />
            <Link
              href={input.trim() ? `/stocks/${input.toUpperCase()}` : "#"}
              aria-disabled={!input.trim()}
              className="btn-premium flex h-14 w-full items-center justify-center disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              onClick={(e) => {
                if (!input.trim()) e.preventDefault();
              }}
            >
              Search Stock
            </Link>
          </form>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <a href="#magnificent-seven" className="btn-premium w-full sm:w-auto">Magnificent Seven</a>
            <Link href="/watchlist" className="btn-premium w-full sm:w-auto">Watchlist</Link>
            <Link href="/compare" className="btn-premium w-full sm:w-auto">Compare</Link>
          </div>
        </header>

        {results.length > 0 && (
          <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-2xl p-4">
            <p className="mb-3 text-sm text-slate-300">Search results</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex min-w-0 flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.shortname ?? item.symbol}</p>
                    <p className="truncate text-xs text-slate-400">{item.symbol}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <FavoriteButton stock={{ symbol: item.symbol, name: item.shortname, exchange: item.exchDisp }} />
                    <Link href={`/stocks/${item.symbol}`} className="btn-premium">View Details</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div id="magnificent-seven">
          <MagnificentSeven />
        </div>
      </div>
    </main>
  );
}
