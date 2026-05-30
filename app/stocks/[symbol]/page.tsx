"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StockDetailPreviewTabs } from "@/components/stocks/StockDetailPreviewTabs";
import type { QuoteResponse } from "@/lib/types/market";

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadQuote = async () => {
    setRefreshing(true);
    const res = await fetch(`/api/quote/${symbol}`, { cache: "no-store" });
    if (res.ok) setData((await res.json()) as QuoteResponse);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadQuote();
    const intervalId = window.setInterval(() => void loadQuote(), 120000);
    return () => window.clearInterval(intervalId);
  }, [symbol]);


  if (!data) return <main className="p-4 sm:p-6">Loading...</main>;

  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Link href="/" className="btn-premium inline-flex">← Back to Dashboard</Link>

        <StockDetailPreviewTabs data={data} onRefresh={() => void loadQuote()} refreshing={refreshing} />
      </div>
    </main>
  );
}
