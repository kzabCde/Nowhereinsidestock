"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
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
    const grouped = new Map<string, { symbol: string; currency: string; quantity: number; cost: number }>();
    for (const item of transactions) {
      const current = grouped.get(item.symbol) ?? { symbol: item.symbol, currency: item.currency, quantity: 0, cost: 0 };
      current.quantity += item.quantity;
      current.cost += item.quantity * item.price;
      grouped.set(item.symbol, current);
    }
    return [...grouped.values()].map((holding) => {
      const quote = quotes[holding.symbol];
      const marketCurrency = quote?.currency ?? holding.currency;
      const marketValue = quote ? quote.latestPrice * holding.quantity : null;
      const pnl = marketValue == null ? null : marketValue - holding.cost;
      const pnlPercent = pnl == null || holding.cost === 0 ? null : (pnl / holding.cost) * 100;
      return { ...holding, marketCurrency, quote, marketValue, pnl, pnlPercent };
    });
  }, [quotes, transactions]);

  const totalsByCurrency = useMemo(() => {
    const totals = new Map<string, { cost: number; marketValue: number; hasMarketValue: boolean }>();
    for (const holding of holdings) {
      const key = holding.marketCurrency;
      const total = totals.get(key) ?? { cost: 0, marketValue: 0, hasMarketValue: false };
      total.cost += holding.cost;
      if (holding.marketValue != null) {
        total.marketValue += holding.marketValue;
        total.hasMarketValue = true;
      }
      totals.set(key, total);
    }
    return [...totals.entries()];
  }, [holdings]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const parsedPrice = Number(price);
    if (!symbol.trim() || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isFinite(parsedPrice) || parsedPrice <= 0) return;
    addTransaction({ symbol, quantity: parsedQuantity, price: parsedPrice, currency, date: new Date(date).toISOString() });
    setSymbol("");
    setQuantity("");
    setPrice("");
  };

  return (
    <PageShell size="wide" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Portfolio tracker</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Positions & unrealized P/L</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Transactions are stored locally in this browser. Totals stay separated by currency so USD and THB are never added together without an FX conversion.
          </p>
        </div>
        <button type="button" onClick={() => void refreshQuotes()} disabled={refreshing || symbols.length === 0} className="btn-premium text-xs">
          {refreshing ? "Refreshing…" : "Refresh quotes"}
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Symbol e.g. AAPL" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0" step="any" placeholder="Quantity" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="any" placeholder="Buy price" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="Currency" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <input value={date} onChange={(event) => setDate(event.target.value)} type="date" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <button type="submit" className="btn-primary justify-center">Add transaction</button>
      </form>

      {totalsByCurrency.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totalsByCurrency.map(([code, total]) => {
            const pnl = total.hasMarketValue ? total.marketValue - total.cost : null;
            return (
              <div key={code} className="rounded-2xl border border-white/[0.08] bg-surface p-4">
                <p className="section-kicker">{code} portfolio</p>
                <p className="mt-2 text-2xl font-bold text-white">{total.hasMarketValue ? formatMarketCurrency(total.marketValue, code) : "—"}</p>
                <p className="mt-1 text-xs text-slate-500">Cost {formatMarketCurrency(total.cost, code)}</p>
                <p className={`mt-3 text-sm font-semibold ${pnl != null && pnl >= 0 ? "text-success" : "text-danger"}`}>
                  P/L {pnl == null ? "—" : formatMarketCurrency(pnl, code)}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
        {holdings.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Add your first transaction to start tracking a portfolio.</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {holdings.map((holding) => (
              <div key={holding.symbol} className="grid gap-3 px-4 py-4 sm:grid-cols-[1.2fr_repeat(4,1fr)_auto] sm:items-center">
                <div>
                  <Link href={`/stocks/${holding.symbol}`} className="font-semibold text-white hover:text-accent">{holding.symbol}</Link>
                  <p className="mt-1 text-xs text-slate-600">{holding.quantity.toLocaleString()} shares</p>
                </div>
                <div><p className="section-kicker">Avg cost</p><p className="mt-1 text-sm text-slate-300">{formatMarketCurrency(holding.cost / holding.quantity, holding.currency)}</p></div>
                <div><p className="section-kicker">Cost</p><p className="mt-1 text-sm text-slate-300">{formatMarketCurrency(holding.cost, holding.currency)}</p></div>
                <div><p className="section-kicker">Market value</p><p className="mt-1 text-sm text-slate-300">{formatMarketCurrency(holding.marketValue, holding.marketCurrency)}</p></div>
                <div>
                  <p className="section-kicker">Unrealized P/L</p>
                  <p className={`mt-1 text-sm font-semibold ${holding.pnl != null && holding.pnl >= 0 ? "text-success" : "text-danger"}`}>
                    {holding.pnl == null ? "—" : `${formatMarketCurrency(holding.pnl, holding.marketCurrency)} (${holding.pnlPercent?.toFixed(2)}%)`}
                  </p>
                </div>
                <Link href={`/compare?symbols=${holding.symbol}`} className="btn-premium justify-center text-xs">Compare</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <div><p className="section-kicker">Transactions</p><h2 className="mt-1 text-lg font-semibold text-white">Local ledger</h2></div>
            <button type="button" onClick={clearPortfolio} className="btn-premium text-xs">Clear all</button>
          </div>
          <div className="mt-4 space-y-2">
            {transactions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-elevated px-3 py-2 text-sm">
                <span className="font-semibold text-white">{item.symbol}</span>
                <span className="text-slate-400">{item.quantity} × {formatMarketCurrency(item.price, item.currency)}</span>
                <span className="text-xs text-slate-600">{new Date(item.date).toLocaleDateString()}</span>
                <button type="button" onClick={() => removeTransaction(item.id)} className="ml-auto text-xs text-danger">Remove</button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
