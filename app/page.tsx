"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import type { SearchItem } from "@/lib/types/market";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  useEffect(() => { const t = setTimeout(() => setDebounced(input.trim()), 350); return () => clearTimeout(t); }, [input]);
  useEffect(() => { if (debounced.length < 2) return setResults([]); void (async () => { const res = await fetch(`/api/search?q=${encodeURIComponent(debounced)}`); if (res.ok) setResults((await res.json()) as SearchItem[]); })(); }, [debounced]);

  return <main className="grid-overlay min-h-screen"><div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6">
    <section className="printstream-shell pearl-border rounded-3xl p-6 text-center sm:p-10">
      <NowhereInsideStockLogo className="justify-center" />
      <p className="mt-3 text-sm text-slate-300">See the trend. Read the signal.</p>
      <form className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row" action="/stocks" onSubmit={(e) => e.preventDefault()}>
        <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 uppercase outline-none focus:border-white/30" placeholder="Search stock symbol..." />
        <Link href={input.trim() ? `/stocks/${input.toUpperCase()}` : "#"} onClick={(e) => !input.trim() && e.preventDefault()} className="btn-premium flex h-12 items-center justify-center">Search</Link>
      </form>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Link href="/rankings" className="btn-premium text-center">Rankings</Link><Link href="/watchlist" className="btn-premium text-center">Watchlist</Link><Link href="/compare" className="btn-premium text-center">Compare</Link>
      </div>
    </section>
    {results.length > 0 && <section className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="mb-2 text-sm text-slate-300">Search results</p><div className="grid gap-2 sm:grid-cols-2">{results.slice(0, 8).map((item) => <Link key={item.symbol} href={`/stocks/${item.symbol}`} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"><p className="truncate font-medium">{item.shortname ?? item.symbol}</p><p className="text-xs text-slate-400">{item.symbol}</p></Link>)}</div></section>}
    <div id="magnificent-seven"><MagnificentSeven /></div>
  </div></main>;
}
