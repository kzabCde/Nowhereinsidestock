"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useMarketQuotes } from "@/lib/client/use-market-quotes";
import { formatMarketCurrency } from "@/lib/format/market";
import { readTransaction, replayLedger, serializePortfolio, summarizeLedger, type TransactionType } from "@/lib/finance/portfolio-ledger";
import { usePortfolioStore } from "@/store/portfolio-store";

const input = "w-full min-w-0 rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white";
const card = "rounded-2xl border border-white/[0.08] bg-surface p-4";
const transactionTypes = ["buy", "sell", "dividend", "fee"] as const;

export default function PortfolioPage() {
  const transactions = usePortfolioStore((state) => state.transactions);
  const addTransaction = usePortfolioStore((state) => state.addTransaction);
  const removeTransaction = usePortfolioStore((state) => state.removeTransaction);
  const importTransactions = usePortfolioStore((state) => state.importTransactions);
  const clearPortfolio = usePortfolioStore((state) => state.clearPortfolio);
  const { locale, t } = useI18n();
  const th = locale === "th";
  const dateLocale = th ? "th-TH" : "en-US";
  const names = th ? { buy: "ซื้อ", sell: "ขาย", dividend: "เงินปันผล", fee: "ค่าธรรมเนียม" } : { buy: "Buy", sell: "Sell", dividend: "Dividend", fee: "Fee" };
  const [type, setType] = useState<TransactionType>("buy");
  const [status, setStatus] = useState<{ error?: string; message?: string }>({});
  const [replace, setReplace] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const ledger = useMemo(() => replayLedger(transactions), [transactions]);
  const positions = ledger.positions;
  const symbols = useMemo(() => positions?.filter((row) => row.quantity > 0).map((row) => row.symbol) ?? [], [positions]);
  const { quotes, refreshing, refresh } = useMarketQuotes(symbols, "summary");
  const { holdings, currencies } = useMemo(() => summarizeLedger(positions ?? [], quotes), [positions, quotes]);
  const trade = type === "buy" || type === "sell";
  const money = (amount: number | null | undefined, code: string) => formatMarketCurrency(amount, code, dateLocale);

  function errorMessage(error: string) {
    if (error === "oversold") return th ? "รายการขายเกินจำนวนหุ้นที่ถือ ณ วันที่ทำรายการ" : "A sale exceeds the shares held on its transaction date.";
    if (error === "id_conflict") return th ? "รหัสรายการซ้ำแต่ข้อมูลต่างกัน" : "A transaction ID already exists with different details.";
    if (error === "invalid_file") return th ? "ไฟล์ไม่ใช่สมุดรายการเวอร์ชันที่รองรับ" : "Choose a valid portfolio JSON export.";
    return th ? "ตรวจสอบสัญลักษณ์ จำนวนเงิน สกุลเงิน และวันที่ของรายการ" : "Check the transaction symbol, amounts, currency, and date.";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const base = { symbol: String(fields.get("symbol") ?? ""), currency: String(fields.get("currency")), date: String(fields.get("date")), note: String(fields.get("note") ?? "") };
    try {
      addTransaction(trade
        ? { ...base, type, quantity: Number(fields.get("quantity")), price: Number(fields.get("price")), fee: Number(fields.get("fee") || 0) }
        : { ...base, type, amount: Number(fields.get("amount")) });
      form.reset();
      setStatus({ message: th ? "บันทึกรายการแล้ว" : "Transaction saved." });
    } catch (reason) {
      setStatus({ error: errorMessage(reason instanceof Error ? reason.message : "") });
    }
  }

  function exportLedger() {
    const url = URL.createObjectURL(new Blob([serializePortfolio(transactions)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nis-portfolio.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importLedger() {
    if (!importFile) return;
    if (replace && !window.confirm(th ? "แทนที่รายการทั้งหมดด้วยไฟล์นี้หรือไม่?" : "Replace the entire local ledger with this file?")) return;
    try {
      if (importFile.size > 5_000_000) throw Error("invalid_file");
      const result = importTransactions(await importFile.text(), replace);
      setStatus({ message: th ? `นำเข้า ${result.added} รายการ · ข้ามรายการซ้ำ ${result.duplicates}` : `Imported ${result.added} transactions · ${result.duplicates} duplicates skipped.` });
      setImportFile(null);
      setReplace(false);
      if (fileInput.current) fileInput.current.value = "";
    } catch (reason) {
      setStatus({ error: errorMessage(reason instanceof Error ? reason.message : "") });
    }
  }

  return (
    <PageShell size="wide" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("portfolio.title")}</h1>
          <p className="mt-2 text-sm text-slate-400">{th ? "สมุดรายการบนอุปกรณ์ · ต้นทุนเฉลี่ย · แยกตามสกุลเงิน" : "Local transaction ledger · average cost · reported by currency"}</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={refreshing || !symbols.length} className="btn-premium">
          {refreshing ? t("common.refreshing") : th ? "รีเฟรชราคา" : "Refresh quotes"}
        </button>
      </div>

      <form onSubmit={submit} className={`${card} space-y-3`}>
        <h2 className="font-semibold text-white">{th ? "เพิ่มรายการ" : "Add transaction"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-sm text-slate-300">{th ? "ประเภทรายการ" : "Transaction type"}
            <select value={type} onChange={(event) => setType(event.target.value as TransactionType)} className={input}>{transactionTypes.map((item) => <option key={item} value={item}>{names[item]}</option>)}</select>
          </label>
          <label className="space-y-1 text-sm text-slate-300">{t("common.symbol")}
            <input name="symbol" required={type !== "fee"} maxLength={21} placeholder="AAPL" className={input} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">{t("common.currency")}
            <input name="currency" required defaultValue="USD" minLength={3} maxLength={3} className={input} />
          </label>
          <label className="space-y-1 text-sm text-slate-300">{th ? "วันที่ทำรายการ" : "Transaction date"}
            <input type="date" name="date" required defaultValue={new Date().toLocaleDateString("sv-SE")} className={input} />
          </label>
          {trade ? <>
            <label className="space-y-1 text-sm text-slate-300">{t("portfolio.shares")}<input name="quantity" type="number" min="0" step="any" required className={input} /></label>
            <label className="space-y-1 text-sm text-slate-300">{th ? "ราคาต่อหุ้น" : "Price per share"}<input name="price" type="number" min="0" step="any" required className={input} /></label>
            <label className="space-y-1 text-sm text-slate-300">{th ? "ค่าธรรมเนียมรายการ" : "Transaction fee"}<input name="fee" type="number" min="0" step="any" className={input} /></label>
          </> : <label className="space-y-1 text-sm text-slate-300">{th ? "จำนวนเงิน" : "Cash amount"}<input name="amount" type="number" min="0" step="any" required className={input} /></label>}
          <label className="space-y-1 text-sm text-slate-300">{th ? "หมายเหตุ" : "Notes"}<input name="note" maxLength={500} className={input} /></label>
        </div>
        <button type="submit" className="btn-primary">{th ? "บันทึกรายการ" : "Save transaction"}</button>
      </form>

      {status.message && <p role="status" className="text-sm text-success">{status.message}</p>}
      {status.error && <p role="alert" className="text-sm text-warning">{status.error}</p>}
      {ledger.error && <p role="alert" className="text-sm text-warning">{th ? "ตรวจสอบประวัติรายการก่อนแสดงมูลค่า" : "Review the ledger before valuation."} {errorMessage(ledger.error.code)} ({ledger.error.row})</p>}

      {currencies.length > 0 && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {currencies.map((total) => (
          <section key={total.currency} className={card}>
            <h2 className="text-lg font-semibold text-white">{total.currency} {t("nav.portfolio")}</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {[
                [t("portfolio.cost"), total.cost],
                [t("portfolio.marketValue"), total.valued || !total.excluded ? total.comparableMarketValue : null],
                [t("portfolio.unrealized"), total.unrealized],
                [th ? "กำไร/ขาดทุนที่รับรู้" : "Realized P&L", total.realized],
                [th ? "เงินปันผล" : "Dividends", total.dividends],
                [th ? "ค่าธรรมเนียมรวม" : "Total fees", total.fees],
                [th ? "กระแสเงินสดสุทธิ" : "Net cash flow", total.cashFlow],
                [th ? "ผลตอบแทนรวม" : "Total P&L", total.totalReturn]
              ].map(([label, amount]) => <div key={label}><dt className="text-xs text-slate-400">{label}</dt><dd className="mt-1 font-medium tabular-nums text-white">{money(amount as number | null, total.currency)}</dd></div>)}
            </dl>
            {total.excluded > 0 && <p className="mt-3 text-xs text-warning">
              {th ? `ประเมินได้ ${total.valued} จาก ${total.valued + total.excluded} รายการ · ต้นทุนที่ใช้คำนวณ` : `${total.valued} of ${total.valued + total.excluded} positions valued · Comparable cost`} {money(total.comparableCost, total.currency)}
            </p>}
          </section>
        ))}
      </div>}

      <section className={card}>
        <h2 className="font-semibold text-white">{th ? "สถานะการถือครอง" : "Holdings"}</h2>
        {!holdings.length && !ledger.error && <p className="mt-2 text-sm text-slate-400">{t("portfolio.empty")}</p>}
        <div className="mt-2 divide-y divide-white/[0.08]">
          {holdings.map((row) => <details key={row.key} className="py-3">
            <summary className="cursor-pointer text-sm text-slate-200">
              <span className="font-semibold text-white">{row.symbol}</span> · {row.quantity.toLocaleString(dateLocale)} {th ? "หุ้น" : "shares"} · {row.allocation == null ? "—" : `${row.allocation.toFixed(1)}% ${row.currency}`}
              <span className="ml-3 tabular-nums">{money(row.marketValue, row.currency)}</span>
            </summary>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span>{t("portfolio.avgCost")} {money(row.cost / row.quantity, row.currency)}</span>
              <span>{t("portfolio.cost")} {money(row.cost, row.currency)}</span>
              <span>{t("portfolio.unrealized")} {money(row.pnl, row.currency)} {row.pnlPercent == null ? "" : `(${row.pnlPercent.toFixed(2)}%)`}</span>
              <Link href={`/stocks/${encodeURIComponent(row.symbol)}`} className="text-accent">{th ? "รายละเอียดหุ้น" : "Stock detail"}</Link>
              <Link href={`/compare?symbols=${encodeURIComponent(row.symbol)}`} className="text-accent">{t("nav.compare")}</Link>
            </div>
            {quotes[row.symbol]?.freshness.stale && <p className="mt-2 text-xs text-warning">{th ? "ราคาที่บันทึกไว้" : "Last available quote"}</p>}
            {row.exclusion && <p className="mt-1 text-xs text-warning">{row.exclusion === "currency-mismatch"
              ? th ? `สกุลเงินราคาไม่ตรงกัน (${row.marketCurrency})` : `Quote currency differs (${row.marketCurrency})`
              : row.exclusion === "missing-quote" ? th ? "ไม่มีราคา" : "Quote unavailable" : th ? "ราคาไม่ถูกต้องหรือไม่มีสกุลเงิน" : "Invalid price or missing currency"}</p>}
          </details>)}
        </div>
        {holdings.some((row) => row.allocation != null) && <p className="mt-2 text-xs text-slate-400">{th ? "สัดส่วนคำนวณจากสถานะที่มีราคาสกุลเงินตรงกัน" : "Allocation uses priced holdings in each currency."}</p>}
      </section>

      <section className={`${card} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">{th ? "สมุดรายการ" : "Transaction history"}</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn-premium" type="button" onClick={exportLedger}>{th ? "ส่งออก JSON" : "Export JSON"}</button>
            {!!transactions.length && <button className="btn-premium text-danger" type="button" onClick={() => {
              if (window.confirm(th ? "ลบรายการทั้งหมดบนอุปกรณ์หรือไม่?" : "Clear all local transactions?")) clearPortfolio();
            }}>{t("compare.clearAll")}</button>}
          </div>
        </div>
        <ul className="divide-y divide-white/[0.08]">
          {transactions.map((raw, index) => {
            let item;
            try { item = readTransaction(raw); } catch { /* retain unrecognized rows for export or repair */ }
            return <li key={`${item?.id ?? "invalid"}:${index}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
              {item ? <>
                <strong className="text-white">{item.symbol || item.currency}</strong>
                <span className="text-slate-300">{names[item.type]}</span>
                <span className="text-slate-300">{"quantity" in item ? `${item.quantity} × ${money(item.price, item.currency)}${item.fee ? ` + ${names.fee} ${money(item.fee, item.currency)}` : ""}` : money(item.amount, item.currency)}</span>
                <time dateTime={item.date} className="text-xs text-slate-400">{new Date(item.date).toLocaleDateString(dateLocale, { timeZone: "UTC" })}</time>
                {item.note && <span className="min-w-0 break-all text-slate-400">{item.note}</span>}
              </> : <span className="text-warning">{th ? "รายการที่ต้องตรวจสอบ" : "Unrecognized transaction"} {index + 1}</span>}
              <button type="button" className="ml-auto px-2 py-2 text-xs text-danger" onClick={() => {
                try { removeTransaction(index); setStatus({}); } catch (reason) { setStatus({ error: errorMessage(reason instanceof Error ? reason.message : "") }); }
              }}>{t("common.remove")}</button>
            </li>;
          })}
        </ul>
        <div className="flex flex-wrap items-end gap-3 border-t border-white/[0.08] pt-3">
          <label className="min-w-0 text-sm text-slate-300">
            {th ? "ไฟล์สมุดรายการ JSON" : "Portfolio JSON file"}
            <input ref={fileInput} type="file" accept=".json,application/json" className={`mt-1 block ${input}`} onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
          </label>
          <label className="flex items-center gap-2 py-2 text-sm text-slate-300"><input type="checkbox" checked={replace} onChange={(event) => setReplace(event.target.checked)} />{th ? "แทนที่รายการเดิม" : "Replace existing ledger"}</label>
          <button type="button" className="btn-premium" disabled={!importFile} onClick={() => void importLedger()}>{th ? "นำเข้า JSON" : "Import JSON"}</button>
        </div>
      </section>
    </PageShell>
  );
}
