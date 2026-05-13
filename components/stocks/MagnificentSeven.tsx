"use client";

import { useEffect, useState } from "react";
import type { QuoteResponse } from "@/lib/types/market";
import { StockCard } from "@/components/stocks/StockCard";

const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

export function MagnificentSeven() {
  const [stocks, setStocks] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const data = await Promise.all(
        symbols.map(async (symbol) => {
          const res = await fetch(`/api/quote/${symbol}`, { cache: "force-cache" });
          if (!res.ok) throw new Error(`Failed ${symbol}`);
          return (await res.json()) as QuoteResponse;
        })
      );
      setStocks(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="h-56 w-full max-w-full animate-pulse rounded-2xl bg-white/5" />;

  return (
    <section className="w-full max-w-full space-y-4">
      <h2 className="text-xl font-semibold">Magnificent Seven</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </section>
  );
}
