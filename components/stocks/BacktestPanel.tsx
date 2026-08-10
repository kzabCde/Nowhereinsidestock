"use client";

import { useMemo, useState } from "react";
import { backtestMovingAverageCross } from "@/lib/analysis/backtest";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { Candle } from "@/lib/types/market";

type Props = { candles: Candle[]; currency?: string };

export function BacktestPanel({ candles, currency = "USD" }: Props) {
  const [shortPeriod, setShortPeriod] = useState(20);
  const [longPeriod, setLongPeriod] = useState(50);
  const { locale, t } = useI18n();
  const result = useMemo(() => backtestMovingAverageCross(candles, shortPeriod, longPeriod), [candles, longPeriod, shortPeriod]);
  const validPeriods = shortPeriod > 0 && longPeriod > shortPeriod;
  const dateLocale = locale === "th" ? "th-TH" : "en-US";

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="section-kicker">{t("backtest.eyebrow")}</p>
          <h2 className="mt-1.5 text-xl font-bold text-white">{t("backtest.title")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{t("backtest.description")}</p>
        </div>
        <span className="w-fit rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">{locale === "th" ? "ข้อมูลย้อนหลัง ไม่ใช่การพยากรณ์" : "Historical, not predictive"}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-500">
          {locale === "th" ? "SMA ระยะสั้น" : "Short SMA"}
          <input type="number" min={2} max={100} value={shortPeriod} onChange={(event) => setShortPeriod(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        </label>
        <label className="text-xs text-slate-500">
          {locale === "th" ? "SMA ระยะยาว" : "Long SMA"}
          <input type="number" min={3} max={250} value={longPeriod} onChange={(event) => setLongPeriod(Number(event.target.value))} className="mt-1 block w-full rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white outline-none" />
        </label>
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3">
          <p className="section-kicker">{locale === "th" ? "แท่งราคาที่ทดสอบ" : "Candles tested"}</p>
          <p className="mt-2 text-xl font-bold text-white">{candles.length}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3">
          <p className="section-kicker">{t("backtest.trades")}</p>
          <p className="mt-2 text-xl font-bold text-white">{result.trades.length}</p>
        </div>
      </div>

      {!validPeriods ? <p className="mt-4 text-sm text-danger">{locale === "th" ? "SMA ระยะยาวต้องมากกว่า SMA ระยะสั้น" : "Long SMA must be greater than Short SMA."}</p> : null}
      {validPeriods && candles.length < longPeriod + 1 ? <p className="mt-4 text-sm text-warning">{locale === "th" ? "ข้อมูลแท่งราคาไม่เพียงพอสำหรับค่า SMA ระยะยาวนี้ กรุณาเลือกช่วงกราฟที่ยาวขึ้น" : "Not enough candles for this long-period setting. Load a longer chart range first."}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3"><p className="section-kicker">{t("backtest.strategyReturn")}</p><p className={`mt-2 text-lg font-bold ${result.totalReturn >= 0 ? "text-success" : "text-danger"}`}>{result.totalReturn >= 0 ? "+" : ""}{result.totalReturn.toFixed(2)}%</p></div>
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3"><p className="section-kicker">{t("backtest.buyHold")}</p><p className={`mt-2 text-lg font-bold ${result.buyAndHoldReturn >= 0 ? "text-success" : "text-danger"}`}>{result.buyAndHoldReturn >= 0 ? "+" : ""}{result.buyAndHoldReturn.toFixed(2)}%</p></div>
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3"><p className="section-kicker">{t("backtest.winRate")}</p><p className="mt-2 text-lg font-bold text-white">{result.winRate.toFixed(2)}%</p></div>
        <div className="rounded-xl border border-white/[0.08] bg-elevated p-3"><p className="section-kicker">{t("backtest.maxDrawdown")}</p><p className="mt-2 text-lg font-bold text-white">{result.maxDrawdown.toFixed(2)}%</p></div>
      </div>

      {result.trades.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-white/[0.08]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-elevated text-xs uppercase tracking-wider text-slate-500"><tr><th className="p-3">{t("backtest.entry")}</th><th className="p-3">{locale === "th" ? "ราคาเข้า" : "Entry price"}</th><th className="p-3">{t("backtest.exit")}</th><th className="p-3">{locale === "th" ? "ราคาออก" : "Exit price"}</th><th className="p-3">{t("backtest.return")}</th></tr></thead>
            <tbody className="divide-y divide-white/[0.06]">
              {result.trades.slice(-10).reverse().map((trade) => (
                <tr key={`${trade.entryDate}-${trade.exitDate}`}>
                  <td className="p-3 text-slate-300">{new Date(trade.entryDate).toLocaleDateString(dateLocale)}</td>
                  <td className="p-3 text-slate-300">{formatMarketCurrency(trade.entryPrice, currency)}</td>
                  <td className="p-3 text-slate-300">{new Date(trade.exitDate).toLocaleDateString(dateLocale)}</td>
                  <td className="p-3 text-slate-300">{formatMarketCurrency(trade.exitPrice, currency)}</td>
                  <td className={`p-3 font-semibold ${trade.returnPercent >= 0 ? "text-success" : "text-danger"}`}>{trade.returnPercent >= 0 ? "+" : ""}{trade.returnPercent.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="mt-5 text-sm text-slate-500">{t("backtest.noTrades")}</p>}

      <p className="mt-4 text-xs leading-5 text-slate-600">{t("backtest.disclaimer")}</p>
    </section>
  );
}
