"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { formatMarketCurrency } from "@/lib/format/market";
import type { QuoteResponse } from "@/lib/types/market";
import { type AlertType, type StockAlert, useAlertStore } from "@/store/alert-store";

type QuoteMap = Record<string, QuoteResponse | undefined>;

const ALERT_LABELS: Record<AlertType, string> = {
  price_above: "Price above",
  price_below: "Price below",
  rsi_above: "RSI above",
  rsi_below: "RSI below",
  golden_cross: "Golden Cross",
  death_cross: "Death Cross"
};

function needsThreshold(type: AlertType): boolean {
  return type === "price_above" || type === "price_below" || type === "rsi_above" || type === "rsi_below";
}

function latestRsi(quote: QuoteResponse | undefined): number | null {
  const value = quote?.indicators.rsi14.at(-1);
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isTriggered(alert: StockAlert, quote: QuoteResponse | undefined): boolean | null {
  if (!quote || !alert.enabled) return null;
  const threshold = alert.threshold;
  if (alert.type === "price_above") return threshold == null ? null : quote.latestPrice > threshold;
  if (alert.type === "price_below") return threshold == null ? null : quote.latestPrice < threshold;
  if (alert.type === "rsi_above") {
    const value = latestRsi(quote);
    return threshold == null || value == null ? null : value > threshold;
  }
  if (alert.type === "rsi_below") {
    const value = latestRsi(quote);
    return threshold == null || value == null ? null : value < threshold;
  }
  if (alert.type === "golden_cross") return quote.movingAverages.crossSignal === "golden_cross";
  if (alert.type === "death_cross") return quote.movingAverages.crossSignal === "death_cross";
  return null;
}

function currentValue(alert: StockAlert, quote: QuoteResponse | undefined): string {
  if (!quote) return "Unavailable";
  if (alert.type === "price_above" || alert.type === "price_below") return formatMarketCurrency(quote.latestPrice, quote.currency ?? "USD");
  if (alert.type === "rsi_above" || alert.type === "rsi_below") {
    const value = latestRsi(quote);
    return value == null ? "RSI warming up" : `RSI ${value.toFixed(2)}`;
  }
  return quote.movingAverages.crossSignal.replaceAll("_", " ");
}

export default function AlertsPage() {
  const alerts = useAlertStore((state) => state.alerts);
  const addAlert = useAlertStore((state) => state.addAlert);
  const removeAlert = useAlertStore((state) => state.removeAlert);
  const toggleAlert = useAlertStore((state) => state.toggleAlert);
  const clearAlerts = useAlertStore((state) => state.clearAlerts);
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [refreshing, setRefreshing] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<AlertType>("price_above");
  const [threshold, setThreshold] = useState("");

  const symbols = useMemo(() => [...new Set(alerts.filter((alert) => alert.enabled).map((alert) => alert.symbol))], [alerts]);

  const refresh = async () => {
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
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.join(",")]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!symbol.trim()) return;

    let parsedThreshold: number | undefined;
    if (needsThreshold(type)) {
      if (!threshold.trim()) return;
      const parsed = Number(threshold);
      if (!Number.isFinite(parsed)) return;
      parsedThreshold = parsed;
    }

    addAlert({ symbol, type, threshold: parsedThreshold });
    setSymbol("");
    setThreshold("");
  };

  return (
    <PageShell size="wide" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Smart alerts</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Price & technical conditions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Alerts are local-first and evaluated when this page loads or refreshes. They do not run in the background yet, so this page does not claim server-side notifications.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing || symbols.length === 0} className="btn-premium text-xs">
          {refreshing ? "Checking…" : "Check now"}
        </button>
      </div>

      <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Symbol e.g. NVDA" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        <select value={type} onChange={(event) => setType(event.target.value as AlertType)} className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none">
          {Object.entries(ALERT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {needsThreshold(type) ? (
          <input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" step="any" placeholder="Threshold" className="rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        ) : (
          <div className="flex items-center rounded-xl border border-white/10 bg-elevated px-3 py-2 text-xs text-slate-500">No numeric threshold required</div>
        )}
        <button type="submit" className="btn-primary justify-center">Add alert</button>
      </form>

      {alerts.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-surface p-8 text-center text-sm text-slate-500">Create your first alert condition.</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-surface">
          <div className="divide-y divide-white/[0.06]">
            {alerts.map((alert) => {
              const quote = quotes[alert.symbol];
              const triggered = isTriggered(alert, quote);
              return (
                <div key={alert.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
                  <div>
                    <Link href={`/stocks/${alert.symbol}`} className="font-semibold text-white hover:text-accent">{alert.symbol}</Link>
                    <p className="mt-1 text-xs text-slate-600">{ALERT_LABELS[alert.type]}{alert.threshold != null ? ` ${alert.threshold}` : ""}</p>
                  </div>
                  <div>
                    <p className="section-kicker">Current</p>
                    <p className="mt-1 text-sm text-slate-300">{currentValue(alert, quote)}</p>
                  </div>
                  <div>
                    <p className="section-kicker">Status</p>
                    <p className={`mt-1 text-sm font-semibold ${!alert.enabled ? "text-slate-500" : triggered === true ? "text-success" : triggered === false ? "text-warning" : "text-slate-500"}`}>
                      {!alert.enabled ? "Paused" : triggered === true ? "Triggered" : triggered === false ? "Waiting" : "Unavailable"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleAlert(alert.id)} className="btn-premium text-xs">{alert.enabled ? "Pause" : "Enable"}</button>
                    <button type="button" onClick={() => removeAlert(alert.id)} className="btn-premium text-xs">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {alerts.length > 0 ? <button type="button" onClick={clearAlerts} className="text-xs text-danger">Clear all alerts</button> : null}
    </PageShell>
  );
}
