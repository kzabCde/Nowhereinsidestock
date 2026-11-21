"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { backtestMovingAverageCross } from "@/lib/analysis/backtest";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import type { Candle } from "@/lib/types/market";

type Props = { candles: Candle[]; currency?: string };
const input = "mt-1 block w-full rounded-xl border border-white/10 bg-elevated px-3 py-2 text-sm text-white";
const percent = (value: number | null) => value == null ? "—" : `${value.toFixed(2)}%`;

export function BacktestPanel({ candles, currency = "" }: Props) {
  const [shortPeriod, setShortPeriod] = useState("20");
  const [longPeriod, setLongPeriod] = useState("50");
  const [capital, setCapital] = useState("10000");
  const [fee, setFee] = useState("0");
  const [slippage, setSlippage] = useState("0");
  const { locale, t } = useI18n();
  const th = locale === "th";
  const result = useMemo(() => backtestMovingAverageCross(candles, Number(shortPeriod), Number(longPeriod), {
    initialCapital: Number(capital), feeBps: Number(fee), slippageBps: Number(slippage)
  }), [candles, capital, fee, longPeriod, shortPeriod, slippage]);
  const money = (value: number) => formatMarketCurrency(value, currency, th ? "th-TH" : "en-US");

  return <section className="min-w-0 space-y-4 rounded-2xl border border-white/[0.08] bg-surface p-4 sm:p-5">
    <h2 className="text-xl font-bold text-white">{t("backtest.title")}</h2>
    <p className="text-sm text-slate-400">{th ? "ยืนยันสัญญาณที่ราคาปิด ส่งผลที่ราคาเปิดของแท่งรายวันถัดไป" : "Signals use the daily close. Fills use the next observed bar’s open."}{currency ? ` · ${currency}` : ""}</p>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {[
        { label: th ? "SMA ระยะสั้น" : "Short SMA", value: shortPeriod, set: setShortPeriod, min: 2, max: 249, step: 1 },
        { label: th ? "SMA ระยะยาว" : "Long SMA", value: longPeriod, set: setLongPeriod, min: 3, max: 250, step: 1 },
        { label: th ? "เงินทุนเริ่มต้น" : "Initial capital", value: capital, set: setCapital, min: 0, step: "any" },
        { label: th ? "ค่าธรรมเนียม (bps)" : "Fee (bps)", value: fee, set: setFee, min: 0, max: 1000, step: "any" },
        { label: th ? "Slippage (bps)" : "Slippage (bps)", value: slippage, set: setSlippage, min: 0, max: 1000, step: "any" }
      ].map((field) => <label key={field.label} className="text-xs text-slate-300">{field.label}
        <input className={input} type="number" min={field.min} max={field.max} step={field.step} value={field.value} onChange={(event) => field.set(event.target.value)} />
      </label>)}
    </div>
    {result.status !== "ok" ? <p role="status" className="text-sm text-warning">{
      result.status === "insufficient_history" ? th ? "ข้อมูลรายวันไม่พอสำหรับช่วง SMA นี้" : "Insufficient daily history for these SMA periods."
        : result.status === "invalid_bars" ? th ? "พบแท่งราคาซ้ำหรือไม่ถูกต้อง" : "Historical bars contain invalid or duplicate observations."
          : th ? "ตรวจสอบช่วง SMA เงินทุน และต้นทุนจำลอง" : "Check SMA periods, initial capital, and cost assumptions."
    }</p> : <>
      <p className="text-xs text-slate-400">{result.start} – {result.end} · {result.bars} {th ? "แท่ง" : "bars"}{result.longestGapDays > 7 ? th ? ` · ช่องว่างสูงสุด ${result.longestGapDays} วัน` : ` · longest calendar gap ${result.longestGapDays} days` : ""}</p>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("backtest.strategyReturn"), percent(result.totalReturn)],
          [t("backtest.buyHold"), percent(result.buyAndHoldReturn)],
          [t("backtest.winRate"), percent(result.winRate)],
          [t("backtest.maxDrawdown"), percent(result.maxDrawdown)],
          [t("backtest.trades"), result.trades.length],
          [th ? "ระยะเวลาถือครอง" : "Exposure", percent(result.exposure)],
          [th ? "ความผันผวนรายปี" : "Annualized volatility", percent(result.volatility)],
          ["Sharpe (0%)", result.sharpe?.toFixed(2) ?? "—"]
        ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.08] bg-elevated p-3">
          <dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 text-base font-semibold tabular-nums text-white">{value}</dd>
        </div>)}
      </dl>
      <div className="h-56 min-w-0" aria-label={th ? "กราฟมูลค่าพอร์ตรายวัน" : "Daily strategy and benchmark equity"}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={result.equityCurve}>
            <CartesianGrid stroke="#ffffff15" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a8a29e" }} minTickGap={40} />
            <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} tickFormatter={(value) => Number(value).toLocaleString(undefined, { notation: "compact" })} width={40} domain={["auto", "auto"]} />
            <Tooltip formatter={(value) => money(Number(value))} contentStyle={{ background: "#171512", border: "1px solid #696058" }} />
            <Line name={t("backtest.strategyReturn")} dataKey="equity" stroke="#d6b36a" dot={false} isAnimationActive={false} />
            <Line name={t("backtest.buyHold")} dataKey="benchmark" stroke="#a8a29e" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {result.inSample && result.outOfSample ? <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
        {[
          [th ? "ในกลุ่มตัวอย่าง" : "In-sample", result.inSample],
          [th ? "นอกกลุ่มตัวอย่าง" : "Out-of-sample", result.outOfSample]
        ].map(([name, sample]) => {
          if (typeof sample === "string") return null;
          return <p key={String(name)} className="rounded-xl bg-elevated p-3"><strong>{String(name)}</strong> · {sample.start} – {sample.end}<br />{t("backtest.strategyReturn")} {percent(sample.totalReturn)} · {t("backtest.buyHold")} {percent(sample.buyAndHoldReturn)}</p>;
        })}
      </div> : <p className="text-xs text-slate-400">{th ? "ข้อมูลไม่พอสำหรับแบ่งช่วงทดสอบนอกกลุ่ม" : "Holdout unavailable for this sample and SMA window."}</p>}
      {!!result.sensitivity.length && <p className="text-sm text-slate-400">{th ? "ทดสอบความไว SMA ระยะสั้น" : "Short SMA sensitivity"} · {result.sensitivity.map((row) => `${row.shortPeriod} → ${percent(row.totalReturn)}`).join(" · ")}</p>}
      {result.openPosition && <p className="text-sm text-slate-300">{th ? "สถานะเปิด ณ ราคาปิดสุดท้าย" : "Open position marked at last close"} · {result.openPosition.entryDate} · {money(result.openPosition.value)} ({money(result.openPosition.unrealized)})</p>}
      {result.trades.length > 0 ? <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="bg-elevated text-xs text-slate-400"><tr><th className="p-2">{t("backtest.entry")}</th><th className="p-2">{t("backtest.exit")}</th><th className="p-2">{t("backtest.return")}</th></tr></thead>
          <tbody className="divide-y divide-white/[0.08]">{[...result.trades].reverse().map((trade) => <tr key={trade.entryDate}>
            <td className="p-2">{trade.entryDate} · {money(trade.entryPrice)}</td><td className="p-2">{trade.exitDate} · {money(trade.exitPrice)}</td><td className="p-2">{percent(trade.returnPercent)}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="text-sm text-slate-400">{t("backtest.noTrades")}</p>}
    </>}
    <p className="text-xs leading-5 text-slate-400">{th
      ? "จำลองแบบ Long และถือเศษหุ้น ค่าธรรมเนียมและ Slippage คิดต่อครั้ง ผลไม่รวมภาษี เงินปันผล หรือข้อจำกัดสภาพคล่อง ช่วงนอกกลุ่มเริ่มใหม่ด้วยพารามิเตอร์เดิม ผลย้อนหลังใช้พยากรณ์ไม่ได้"
      : "Long-only simulation with fractional shares. Fees and slippage apply per fill. Results exclude taxes, dividends and liquidity constraints. The holdout starts flat with the same settings. Historical results do not predict returns."}</p>
  </section>;
}
