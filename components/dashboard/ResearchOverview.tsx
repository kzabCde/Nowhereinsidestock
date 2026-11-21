"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useI18n } from "@/components/i18n/I18nProvider";
import { replayLedger } from "@/lib/finance/portfolio-ledger";
import { formatMarketCurrency } from "@/lib/format/market";
import { useAlertStore } from "@/store/alert-store";
import { usePortfolioStore } from "@/store/portfolio-store";
import { useResearchStore } from "@/store/research-store";
import { useWatchlistStore } from "@/store/watchlist-store";

const MagnificentSeven = dynamic(() => import("@/components/stocks/MagnificentSeven").then((module) => module.MagnificentSeven));

function StockLinks({ stocks }: { stocks: Array<{ symbol: string; name?: string }> }) {
  return <ul className="flex flex-wrap gap-2">
    {stocks.map(({ symbol, name }) => <li key={symbol}>
      <Link className="inline-flex min-h-9 items-center rounded-lg border border-white/[0.1] bg-elevated px-3 text-sm font-medium text-accent" href={`/stocks/${encodeURIComponent(symbol)}`} title={name}>{symbol}</Link>
    </li>)}
  </ul>;
}

export function ResearchOverview() {
  const watchlist = useWatchlistStore(({ watchlist }) => watchlist);
  const transactions = usePortfolioStore(({ transactions }) => transactions);
  const alerts = useAlertStore(({ alerts }) => alerts);
  const events = useAlertStore(({ events }) => events);
  const recent = useResearchStore(({ recent }) => recent);
  const [showMarkets, setShowMarkets] = useState(false);
  const { locale, t } = useI18n();
  const th = locale === "th";
  const ledger = useMemo(() => replayLedger(transactions), [transactions]);
  const open = ledger.positions?.filter(({ quantity }) => quantity > 0) ?? [];
  const basis = new Map<string, number>();
  for (const { currency, cost } of open) basis.set(currency, (basis.get(currency) ?? 0) + cost);
  const enabled = alerts.filter((row) => row.enabled).length;
  const unread = events.filter((row) => !row.read).length;
  const card = "min-w-0 space-y-3 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5";
  const heading = "text-base font-semibold text-white hover:text-accent";

  return <>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={th ? "ภาพรวมพื้นที่ทำงาน" : "Workspace overview"}>
      <article className={card}>
        <h2><Link href="/watchlist" className={heading}>{t("watchlist.title")}</Link></h2>
        <p className="text-sm text-slate-400">{watchlist.length ? th ? `${watchlist.length} สัญลักษณ์` : `${watchlist.length} saved symbols` : t("watchlist.emptyTitle")}</p>
        {!!watchlist.length && <StockLinks stocks={watchlist.slice(0, 4)} />}
      </article>
      <article className={card}>
        <h2><Link href="/portfolio" className={heading}>{t("portfolio.title")}</Link></h2>
        <p className="text-sm text-slate-400">{ledger.error ? th ? "ตรวจสอบสมุดรายการ" : "Review the transaction ledger"
          : open.length ? th ? `${open.length} สถานะเปิด · ต้นทุนตามสกุลเงิน` : `${open.length} open positions · cost by currency`
            : th ? "ยังไม่มีสถานะเปิด" : "No open positions"}</p>
        {!!basis.size && <ul className="space-y-1 text-sm tabular-nums text-slate-200">{[...basis].map(([currency, cost]) => <li key={currency}>{formatMarketCurrency(cost, currency, th ? "th-TH" : "en-US")}</li>)}</ul>}
      </article>
      <article className={card}>
        <h2><Link href="/alerts" className={heading}>{t("nav.alerts")}</Link></h2>
        <p className="text-sm text-slate-400">{enabled ? th ? `เปิดติดตามบนอุปกรณ์ ${enabled} รายการ` : `${enabled} monitored on this device` : t("alerts.empty")}</p>
        {unread > 0 && <p className="text-sm font-semibold text-accent">{th ? `ยังไม่ได้อ่าน ${unread} รายการ` : `${unread} unread`}</p>}
      </article>
      <article className={card}>
        <h2 className={heading}>{th ? "หุ้นที่ดูล่าสุด" : "Recently viewed"}</h2>
        {recent.length ? <StockLinks stocks={recent.slice(0, 5)} /> : <p className="text-sm text-slate-400">{th ? "หุ้นที่เปิดดูจะแสดงที่นี่" : "Stocks you open appear here."}</p>}
      </article>
    </section>
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/rankings/magnificent-seven" className={heading}>Magnificent Seven</Link>
        <button className="btn-premium" type="button" aria-expanded={showMarkets} aria-controls="magnificent-seven-quotes" onClick={() => setShowMarkets((previous) => !previous)}>
          {showMarkets ? th ? "ซ่อนกราฟ" : "Hide quote charts" : th ? "แสดงกราฟราคา" : "Show quote charts"}
        </button>
      </div>
      {showMarkets && <div id="magnificent-seven-quotes"><MagnificentSeven /></div>}
    </section>
  </>;
}
