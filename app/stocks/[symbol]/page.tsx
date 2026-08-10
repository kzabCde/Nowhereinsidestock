"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { StockDetailPreviewTabs } from "@/components/stocks/StockDetailPreviewTabs";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { QuoteResponse } from "@/lib/types/market";

export default function StockDetailPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = params.symbol.toUpperCase();
  const [data, setData] = useState<QuoteResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { locale } = useI18n();

  const loadQuote = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/quote/${encodeURIComponent(symbol)}`);
      if (!res.ok) throw new Error(locale === "th" ? `ไม่สามารถโหลดข้อมูล ${symbol} ได้` : `Unable to load ${symbol}`);
      setData((await res.json()) as QuoteResponse);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : (locale === "th" ? "ไม่สามารถโหลดข้อมูลหุ้นได้" : "Unable to load stock data"));
    } finally {
      setRefreshing(false);
    }
  }, [locale, symbol]);

  useEffect(() => {
    void loadQuote();
    const intervalId = window.setInterval(() => void loadQuote(), 120000);
    return () => window.clearInterval(intervalId);
  }, [loadQuote]);

  return (
    <PageShell size="wide" className="space-y-5">
      {!data && !error ? <LoadingSkeleton label={locale === "th" ? `กำลังโหลด ${symbol}` : `Loading ${symbol}`} /> : null}
      {error && !data ? <ErrorState message={error} onRetry={() => void loadQuote()} /> : null}
      {error && data ? <div className="rounded-xl border border-warning/20 bg-warning/5 px-4 py-3 text-sm text-warning">{locale === "th" ? `รีเฟรชไม่สำเร็จ: ${error} กำลังแสดงข้อมูลล่าสุดที่โหลดสำเร็จ` : `Refresh failed: ${error}. Showing the last successful snapshot.`}</div> : null}
      {data ? <StockDetailPreviewTabs data={data} onRefresh={() => void loadQuote()} refreshing={refreshing} /> : null}
    </PageShell>
  );
}
