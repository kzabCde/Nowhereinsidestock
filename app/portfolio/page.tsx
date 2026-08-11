"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { QuoteResponse } from "@/lib/types/market";
import { usePortfolioStore } from "@/store/portfolio-store";

type QuoteMap = Record<string, QuoteResponse | undefined>;

export default function PortfolioPage() {
  const transactions = usePortfolioStore((state) => state.transactions);
  const addTransaction = usePortfolioStore((state) => state.addTransaction);
  const removeTransaction = usePortfolioStore((state) => state.removeTransaction);
  const clearPortfolio = usePortfolioStore((state) => state.clearPortfolio);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [refreshing, setRefreshing] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const { locale, t } = useI18n();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  const symbols = useMemo(() => [...new Set(transactions.map((item) => item.symbol))], [transactions]);

  const refreshQuotes = async () => {
    if (symbols.length === 0) return;
    setRefreshing(true);
    const entries = await Promise.all(
      symbols.map(async (item) => {
        try {
          const response = await fetch(`/api/quote/${encodeURIComponent(item)}`);
          if (!response.ok) return [item, undefined] as const;
          return [item, (await response.json()) as QuoteResponse] as const;
        } catch {
          return [item, undefined] as const;
        }
      })
    );
    setQuotes(Object.fromEntries(entries));
    setRefreshing(false);
  };

  useEffect(() => {
    void refreshQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  const holdings = useMemo(() => {
    const grouped = new Map<string, { key: string; symbol: string; currency: string; quantity: number; cost: number }>();
    for (const item of transactions) {
      const key = `${item.symbol}:${item.currency}`;
      const current = grouped.get(key) ?? { key, symbol: item.symbol, currency: item.currency, quantity: 0, cost: 0 };
      current.quantity += item.quantity;
      current.cost += item.quantity * item.price;
      grouped.set(key, current);
    }

    return [...grouped.values()].map((holding) => {
      const quote = quotes[holding.symbol];
      const marketCurrency = quote?.currency ?? holding.currency;
      const marketValue = quote ? quote.latestPrice * holding.quantity : null;
      const sameCurrency = marketCurrency === holding.currency;
      const pnl = marketValue == null || !sameCurrency ? null : marketValue - holding.cost;
      const pnlPercent = pnl == null || holding.cost === 0 ? null : (pnl / holding.cost) * 100;
      return { ...holding, marketCurrency, quote, marketValue, sameCurrency, pnl, pnlPercent };
    });
  }, [quotes, transactions]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { cost: number; marketValue: number; hasComparableMarketValue: boolean; excludedPositions: number }>();
    for (const holding of holdings) {
      const key = holding.currency;
      const total = totals.get(key) ?? { cost: 0, marketValue: 0, hasComparableMarketValue: false, excludedPositions: 0 };
      total.cost += holding.cost;
      if (holding.marketValue != null && holding.sameCurrency) {
        total.marketValue += holding.marketValue;
        total.hasComparableMarketValue = true;
      } else if (holding.marketValue != null && !holding.sameCurrency) {
        total.excludedPositions += 1;
      }
      totals.set(key, total);
    }
    return [...totals.entries()];
  }, [holdings]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    const normalizedCurrency = currency.trim().toUpperCase();
    if (!symbol.trim() || !normalizedCurrency || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
    addTransaction({ symbol, quantity: parsedQuantity, price: parsedPrice, currency: normalizedCurrency, date: new Date(date).toISOString() });
    setSymbol("");
    setQuantity("");
    setPrice("");
  };

  return (
    <PageShell size="wide" className="space-y-6">
      <PageHeader
        eyebrow={t("portfolio.eyebrow")}
        title={t("portfolio.title")}
        description={t("portfolio.description")}
        meta={<span className="badge-neutral">{locale === "th" ? "Local-first" : "Local-first"}</span>}
        actions={<button type="button" onClick={() => void refreshQuotes()} disabled={refreshing || symbols.length === 0} className="btn-premium text-xs">{refreshing ? t("common.refreshing") : locale === "th" ? "รีเฟรชราคา" : "Refresh quotes"}</button>}
      />

      <form onSubmit={submit} className="control-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder={locale === "th" ? "สัญลักษณ์ เช่น AAPL" : "Symbol e.g. AAPL"} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0" step="any" placeholder={t("portfolio.shares")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="any" placeholder={locale === "th" ? "ราคาซื้อ" : "Buy price"} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder={t("common.currency")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <button type="submit" className="btn-primary justify-center">{locale === "th" ? "เพิ่มรายการซื้อ" : "Add transaction"}</button>
      </form>

      {totalsByCurrency.length > 0 ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totalsByCurrency.map(([code, total]) => {
            const pnl = total.hasComparableMarketValue ? total.marketValue - total.cost : null;
            return (
              <article key={code} className="interactive-card p-5">
                <div className="relative z-[1] flex items-center justify-between gap-3"><p className="section-kicker">{code} {t("nav.portfolio")}</p><span className="badge-neutral">{code}</span></div>
                <p className="relative z-[1] mt-4 text-3xl font-semibold tabular-nums tracking-[-0.035em] text-white">{total.hasComparableMarketValue ? formatMarketCurrency(total.marketValue, code) : "—"}</p>
                <p className="relative z-[1] mt-2 text-xs text-slate-500">{t("portfolio.cost")} {formatMarketCurrency(total.cost, code)}</p>
                <p className={`relative z-[1] mt-4 text-sm font-semibold ${pnl != null && pnl >= 0 ? "text-success" : "text-danger"}`}>{t("portfolio.unrealized")} {pnl == null ? "—" : formatMarketCurrency(pnl, code)}</p>
                {total.excludedPositions > 0 ? <p className="relative z-[1] mt-2 text-xs leading-5 text-warning">{locale === "th" ? `${total.excludedPositions} รายการไม่รวมใน P/L เพราะสกุลเงินของราคาตลาดไม่ตรงกัน` : `${total.excludedPositions} position(s) excluded from P/L because quote currency differs.`}</p> : null}
              </article>
            );
          })}
        </section>
      ) : null}

      <section className="table-shell">
        {holdings.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">{t("portfolio.empty")}</div>
        ) : (
          <>
            <div className="hidden grid-cols-[1.2fr_repeat(4,1fr)_auto] gap-3 border-b border-white/[0.055] bg-white/[0.018] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:grid">
              <span>{locale === "th" ? "สถานะถือครอง" : "Position"}</span><span>{t("portfolio.avgCost")}</span><span>{t("portfolio.cost")}</span><span>{t("portfolio.marketValue")}</span><span>{t("portfolio.unrealized")}</span><span>{locale === "th" ? "การทำงาน" : "Action"}</span>
            </div>
            <div className="divide-y divide-white/[0.055]">
              {holdings.map((holding) => (
                <div key={holding.key} className="table-row grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_repeat(4,1fr)_auto] sm:items-center">
                  <div><Link href={`/stocks/${holding.symbol}`} className="font-semibold text-white transition-colors hover:text-accent">{holding.symbol}</Link><p className="mt-1 text-xs text-slate-600">{holding.quantity.toLocaleString(dateLocale)} {locale === "th" ? "หุ้น · ต้นทุนเป็น" : "shares · cost in"} {holding.currency}</p></div>
                  <div><p className="section-kicker sm:hidden">{t("portfolio.avgCost")}</p><p className="mt-1 text-sm tabular-nums text-slate-300 sm:mt-0">{formatMarketCurrency(holding.cost / holding.quantity, holding.currency)}</p></div>
                  <div><p className="section-kicker sm:hidden">{t("portfolio.cost")}</p><p className="mt-1 text-sm tabular-nums text-slate-300 sm:mt-0">{formatMarketCurrency(holding.cost, holding.currency)}</p></div>
                  <div><p className="section-kicker sm:hidden">{t("portfolio.marketValue")}</p><p className="mt-1 text-sm tabular-nums text-slate-300 sm:mt-0">{formatMarketCurrency(holding.marketValue, holding.marketCurrency)}</p></div>
                  <div><p className="section-kicker sm:hidden">{t("portfolio.unrealized")}</p><p className={`mt-1 text-sm font-semibold tabular-nums sm:mt-0 ${holding.pnl != null && holding.pnl >= 0 ? "text-success" : "text-danger"}`}>{holding.pnl == null ? "—" : `${formatMarketCurrency(holding.pnl, holding.currency)} (${holding.pnlPercent?.toFixed(2)}%)`}</p>{!holding.sameCurrency && holding.quote ? <p className="mt-1 text-[10px] text-warning">{locale === "th" ? "ต้องแปลงสกุลเงิน" : "Needs FX conversion"} ({holding.currency} → {holding.marketCurrency})</p> : null}</div>
                  <Link href={`/compare?symbols=${holding.symbol}`} className="btn-premium justify-center text-xs">{t("nav.compare")}</Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {transactions.length > 0 ? (
        <section className="data-panel p-5 sm:p-6">
          <div className="relative z-[1] flex items-center justify-between gap-3"><div><p className="section-kicker">{locale === "th" ? "รายการซื้อ" : "Transactions"}</p><h2 className="mt-1.5 text-lg font-semibold text-white">{locale === "th" ? "สมุดรายการบนอุปกรณ์" : "Local ledger"}</h2></div><button type="button" onClick={clearPortfolio} className="btn-premium text-xs">{t("compare.clearAll")}</button></div>
          <div className="relative z-[1] mt-4 space-y-2">
            {transactions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 py-2.5 text-sm">
                <span className="font-semibold text-white">{item.symbol}</span><span className="text-slate-400">{item.quantity} × {formatMarketCurrency(item.price, item.currency)}</span><span className="text-xs text-slate-600">{new Date(item.date).toLocaleDateString(dateLocale)}</span><button type="button" onClick={() => removeTransaction(item.id)} className="ml-auto text-xs text-danger transition-colors hover:text-red-300">{t("common.remove")}</button>
              </div>
            ))}
          </div>
          <p className="relative z-[1] mt-4 text-xs text-slate-600">{t("portfolio.note")}</p>
        </section>
      ) : null}
    </PageShell>
  );
}
