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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Live preview · refreshes every 60s</p>
          <h2 className="mt-1.5 text-xl font-semibold text-white">Magnificent Seven</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stocks.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </section>
  );
}
