"use client";

import { useMarketQuotes } from "@/lib/client/use-market-quotes";
import { StockCard } from "@/components/stocks/StockCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useI18n } from "@/components/i18n/I18nProvider";

const symbols = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA"];

export function MagnificentSeven() {
  const { quotes, errors } = useMarketQuotes(symbols, "technical", 120_000);
  const { locale } = useI18n();
  const stocks = symbols.flatMap((symbol) => quotes[symbol] ?? []);
  const failures = symbols.filter((symbol) => errors[symbol]).length;

  if (stocks.length === 0 && failures === 0) return <LoadingSkeleton label={locale === "th" ? "กำลังโหลด Magnificent Seven" : "Loading Magnificent Seven"} />;

  return (
    <section className="space-y-4">
      {failures > 0 && <p className="text-sm text-warning">{locale === "th" ? `รีเฟรชไม่สำเร็จ ${failures} รายการ` : `Refresh failed for ${failures} symbols.`}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stocks.map((stock) => <StockCard key={stock.symbol} stock={stock} />)}
      </div>
    </section>
  );
}
