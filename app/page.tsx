"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { FavoriteButton } from "@/components/stocks/FavoriteButton";
import type { SearchItem } from "@/lib/types/market";

export default function HomePage() {
  const [input, setInput] = useState("AAPL");
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
    <main className="grid-overlay min-h-screen">
      <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
        <header className="printstream-shell pearl-border glow-soft rounded-3xl p-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">NowhereInsideStock</h1>
          <p className="mt-2 text-lg text-slate-300">See the trend. Read the signal.</p>
          <form className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row" action="/stocks" onSubmit={(e) => e.preventDefault()}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="h-14 flex-1 rounded-2xl border border-white/20 bg-black/50 px-5 text-lg uppercase outline-none focus:border-cyan-300"
              placeholder="Search a stock symbol (e.g., AAPL)"
            />
            <Link href={`/stocks/${input.toUpperCase()}`} className="btn-premium flex h-14 items-center justify-center px-8 text-base">Search Stock</Link>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <a href="#magnificent-seven" className="btn-premium">Magnificent Seven</a>
            <Link href="/watchlist" className="btn-premium">Watchlist</Link>
            <Link href={`/stocks/${input.toUpperCase()}`} className="btn-premium">Compare</Link>
          </div>
        </header>

        {results.length > 0 && (
          <section className="printstream-shell pearl-border rounded-2xl p-4">
            <p className="mb-3 text-sm text-slate-300">Search results</p>
            <div className="grid gap-2 md:grid-cols-2">
              {results.slice(0, 8).map((item) => (
                <div key={item.symbol} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="font-medium">{item.shortname ?? item.symbol}</p>
                    <p className="text-xs text-slate-400">{item.symbol}</p>
                  </div>
                  <div className="flex gap-2">
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
