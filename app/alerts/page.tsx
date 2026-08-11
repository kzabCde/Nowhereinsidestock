"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { QuoteResponse } from "@/lib/types/market";
import { type AlertType, type StockAlert, useAlertStore } from "@/store/alert-store";

type QuoteMap = Record<string, QuoteResponse | undefined>;

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
  const { locale, t } = useI18n();

  const alertLabels: Record<AlertType, string> = {
    price_above: t("alerts.priceAbove"),
    price_below: t("alerts.priceBelow"),
    rsi_above: t("alerts.rsiAbove"),
    rsi_below: t("alerts.rsiBelow"),
    golden_cross: t("alerts.goldenCross"),
    death_cross: t("alerts.deathCross")
  };

  const currentValue = (alert: StockAlert, quote: QuoteResponse | undefined): string => {
    if (!quote) return locale === "th" ? "ไม่มีข้อมูล" : "Unavailable";
    if (alert.type === "price_above" || alert.type === "price_below") return formatMarketCurrency(quote.latestPrice, quote.currency ?? "USD");
    if (alert.type === "rsi_above" || alert.type === "rsi_below") {
      const value = latestRsi(quote);
      return value == null ? (locale === "th" ? "RSI ยังมีข้อมูลไม่พอ" : "RSI warming up") : `RSI ${value.toFixed(2)}`;
    }
    if (quote.movingAverages.crossSignal === "golden_cross") return t("alerts.goldenCross");
    if (quote.movingAverages.crossSignal === "death_cross") return t("alerts.deathCross");
    return locale === "th" ? "ยังไม่มีสัญญาณตัดกัน" : "No active cross signal";
  };

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
      <PageHeader
        eyebrow={t("alerts.eyebrow")}
        title={t("alerts.title")}
        description={t("alerts.description")}
        meta={<span className="badge-neutral">{locale === "th" ? "ประเมินเมื่อเปิดหน้า" : "On-demand evaluation"}</span>}
        actions={<button type="button" onClick={() => void refresh()} disabled={refreshing || symbols.length === 0} className="btn-premium text-xs">{refreshing ? (locale === "th" ? "กำลังตรวจ…" : "Checking…") : t("alerts.refresh")}</button>}
      />

      <form onSubmit={submit} className="control-panel grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder={locale === "th" ? "สัญลักษณ์ เช่น NVDA" : "Symbol e.g. NVDA"} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        <select value={type} onChange={(event) => setType(event.target.value as AlertType)} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none">
          {Object.entries(alertLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {needsThreshold(type) ? (
          <input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" step="any" placeholder={t("alerts.target")} className="rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white outline-none" />
        ) : (
          <div className="flex items-center rounded-xl border border-white/[0.07] bg-white/[0.018] px-3 py-2.5 text-xs text-slate-500">{locale === "th" ? "เงื่อนไขนี้ไม่ต้องกำหนดตัวเลข" : "No numeric threshold required"}</div>
        )}
        <button type="submit" className="btn-primary justify-center">{t("alerts.add")}</button>
      </form>

      {alerts.length === 0 ? (
        <div className="data-panel p-10 text-center text-sm text-slate-500">{t("alerts.empty")}</div>
      ) : (
        <section className="table-shell">
          <div className="hidden grid-cols-[1fr_1fr_1fr_auto] gap-3 border-b border-white/[0.055] bg-white/[0.018] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:grid">
            <span>{locale === "th" ? "เงื่อนไข" : "Rule"}</span><span>{locale === "th" ? "ค่าปัจจุบัน" : "Current"}</span><span>{locale === "th" ? "สถานะ" : "Status"}</span><span>{locale === "th" ? "การทำงาน" : "Actions"}</span>
          </div>
          <div className="divide-y divide-white/[0.055]">
            {alerts.map((alert) => {
              const quote = quotes[alert.symbol];
              const triggered = isTriggered(alert, quote);
              const status = !alert.enabled ? (locale === "th" ? "หยุดชั่วคราว" : "Paused") : triggered === true ? t("alerts.triggered") : triggered === false ? (locale === "th" ? "รอเข้าเงื่อนไข" : "Waiting") : (locale === "th" ? "ไม่มีข้อมูล" : "Unavailable");
              return (
                <div key={alert.id} className="table-row grid gap-3 px-4 py-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center">
                  <div><Link href={`/stocks/${alert.symbol}`} className="font-semibold text-white transition-colors hover:text-accent">{alert.symbol}</Link><p className="mt-1 text-xs text-slate-600">{alertLabels[alert.type]}{alert.threshold != null ? ` ${alert.threshold}` : ""}</p></div>
                  <div><p className="section-kicker sm:hidden">{locale === "th" ? "ค่าปัจจุบัน" : "Current"}</p><p className="mt-1 text-sm text-slate-300 sm:mt-0">{currentValue(alert, quote)}</p></div>
                  <div><p className="section-kicker sm:hidden">{locale === "th" ? "สถานะ" : "Status"}</p><span className={!alert.enabled ? "badge-neutral" : triggered === true ? "badge-positive" : triggered === false ? "badge border-warning/25 bg-warning/10 text-warning" : "badge-neutral"}>{status}</span></div>
                  <div className="flex gap-2"><button type="button" onClick={() => toggleAlert(alert.id)} className="btn-premium text-xs">{alert.enabled ? (locale === "th" ? "หยุด" : "Pause") : (locale === "th" ? "เปิดใช้" : "Enable")}</button><button type="button" onClick={() => removeAlert(alert.id)} className="btn-premium border-danger/15 text-xs text-danger/70 hover:text-danger">{t("common.remove")}</button></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-white/[0.055] pt-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("alerts.note")}</p>
        {alerts.length > 0 ? <button type="button" onClick={clearAlerts} className="text-danger/75 transition-colors hover:text-danger">{locale === "th" ? "ล้างการแจ้งเตือนทั้งหมด" : "Clear all alerts"}</button> : null}
      </div>
    </PageShell>
  );
}
