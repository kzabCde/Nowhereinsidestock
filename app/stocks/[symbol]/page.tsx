"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StockDetailPreviewTabs } from "@/components/stocks/StockDetailPreviewTabs";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
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

  return (
    <PageShell size="wide" className="space-y-5">
      {!data ? <LoadingSkeleton label={`Loading ${symbol}`} /> : <StockDetailPreviewTabs data={data} onRefresh={() => void loadQuote()} refreshing={refreshing} />}
    </PageShell>
  );
}
