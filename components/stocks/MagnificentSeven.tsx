"use client";

import { useEffect, useState } from "react";
import type { QuoteResponse } from "@/lib/types/market";
import { StockCard } from "@/components/stocks/StockCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

export function MagnificentSeven() {
  const [stocks, setStocks] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await Promise.all(
        symbols.map(async (symbol) => {
          const res = await fetch(`/api/quote/${symbol}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`Failed ${symbol}`);
          return (await res.json()) as QuoteResponse;
        })
      );
      if (!mounted) return;
      setStocks(data);
      setLoading(false);
    };
    void load();
    const intervalId = window.setInterval(() => void load(), 60000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  if (loading) return <LoadingSkeleton label="Loading Magnificent Seven" />;

  return (
    <section className="w-full max-w-full space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Live preview</p>
          <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Magnificent Seven</h2>
        </div>
        <p className="text-sm text-slate-400">Auto-refreshes every 60 seconds.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </section>
  );
}
