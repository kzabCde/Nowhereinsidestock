"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useAlertStore } from "@/store/alert-store";
import { isPriceAlert } from "@/lib/alerts/evaluate";
import { alertReading } from "@/lib/alerts/reading";
import { useMarketQuotes } from "@/lib/client/use-market-quotes";
import { useI18n } from "@/components/i18n/I18nProvider";

function Monitoring({ prices }: { prices: boolean }) {
  const alerts = useAlertStore((state) => state.alerts);
  const apply = useAlertStore((state) => state.applyReadings);
  const request = useAlertStore((state) => state.checkRequest);
  const symbols = useMemo(() => alerts.filter((alert) => alert.enabled && isPriceAlert(alert.type) === prices).map((alert) => alert.symbol), [alerts, prices]);
  const { quotes, errors, refresh } = useMarketQuotes(symbols, prices ? "summary" : "technical", prices ? 120_000 : 300_000);

  useEffect(() => {
    if (!request) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [request, refresh]);

  useEffect(() => {
    const keys = new Set([...Object.keys(quotes), ...Object.keys(errors)]);
    if (!keys.size) return;
    apply(Object.fromEntries([...keys].map((symbol) => [symbol, alertReading(quotes[symbol])])), prices);
  }, [quotes, errors, apply, prices]);

  return null;
}

export function AlertMonitor() {
  const events = useAlertStore((state) => state.events);
  const acknowledge = useAlertStore((state) => state.acknowledge);
  const { locale } = useI18n();
  const unread = events.filter((event) => !event.read);
  const th = locale === "th";
  return <>
    <Monitoring prices />
    <Monitoring prices={false} />
    {unread.length > 0 && <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 border-b border-accent/20 bg-accent/10 px-4 py-2 text-sm text-accent" role="status">
      <Link href="/alerts">{th ? `การแจ้งเตือนใหม่ ${unread.length} รายการ` : `${unread.length} new alert${unread.length === 1 ? "" : "s"}`}</Link>
      <button className="ml-auto px-2 py-1 text-xs underline" onClick={acknowledge}>{th ? "ทำเครื่องหมายว่าอ่านแล้ว" : "Mark read"}</button>
    </div>}
  </>;
}
