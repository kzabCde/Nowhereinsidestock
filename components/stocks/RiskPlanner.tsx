"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { calculatePositionSize } from "@/lib/finance/position-sizing";
import { formatMarketCurrency } from "@/lib/format/market";

type RiskPlannerProps = {
  symbol?: string;
  currentPrice?: number;
  currency?: string;
  support?: number | null;
  resistance?: number | null;
  compact?: boolean;
};

function numberInput(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(4))) : "";
}

export function RiskPlanner({
  symbol,
  currentPrice = 100,
  currency = "USD",
  support,
  resistance,
  compact = false
}: RiskPlannerProps) {
  const { locale } = useI18n();
  const dateLocale = locale === "th" ? "th-TH" : "en-US";
  const initialEntry = currentPrice > 0 ? currentPrice : 100;
  const initialStop = support != null && support > 0 && support < initialEntry ? support : initialEntry * 0.95;
  const initialTarget = resistance != null && resistance > initialEntry ? resistance : initialEntry * 1.1;

  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState("1");
  const [entryPrice, setEntryPrice] = useState(() => numberInput(initialEntry));
  const [stopPrice, setStopPrice] = useState(() => numberInput(initialStop));
  const [targetPrice, setTargetPrice] = useState(() => numberInput(initialTarget));

  const calculation = useMemo(() => {
    try {
      const result = calculatePositionSize({
        accountSize: Number(accountSize),
        riskPercent: Number(riskPercent),
        entryPrice: Number(entryPrice),
        stopPrice: Number(stopPrice),
        targetPrice: targetPrice.trim() ? Number(targetPrice) : null
      });
      return { result, error: null as string | null };
    } catch (reason) {
      return {
        result: null,
        error: reason instanceof Error ? reason.message : "Invalid position sizing inputs"
      };
    }
  }, [accountSize, entryPrice, riskPercent, stopPrice, targetPrice]);

  const result = calculation.result;
  const directionLabel = result?.direction === "short"
    ? locale === "th" ? "ฝั่ง Short" : "Short setup"
    : locale === "th" ? "ฝั่ง Long" : "Long setup";

  const inputClass = "mt-1.5 w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm tabular-nums text-white outline-none transition focus:border-accent/45";
  const formatMoney = (value: number | null | undefined) => formatMarketCurrency(value, currency, dateLocale);

  return (
    <div className={`rounded-2xl border border-[#d6b36a]/12 bg-[#0d0c09] ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-accent">
            <ShieldCheck size={16} />
            <p className="section-kicker">{locale === "th" ? "วางแผนความเสี่ยงก่อนเปิดสถานะ" : "Pre-trade risk planning"}</p>
          </div>
          <h2 className="mt-2 text-xl font-bold text-white">
            {locale === "th" ? "Risk / Position Size Planner" : "Risk / Position Size Planner"}
            {symbol ? <span className="ml-2 text-slate-500">· {symbol}</span> : null}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            {locale === "th"
              ? "กำหนดเงินที่ยอมเสี่ยงต่อหนึ่งแผน แล้วคำนวณจำนวนหุ้นจากระยะ Entry–Stop โดยจำกัดขนาดสถานะไม่ให้เกินเงินสดที่ระบุ"
              : "Choose how much capital you are willing to risk on one setup. Position size is derived from the Entry–Stop distance and capped by the stated cash balance."}
          </p>
        </div>
        {result ? (
          <span className="shrink-0 rounded-full border border-accent/20 bg-accent/[0.07] px-3 py-1 text-xs font-semibold text-[#ead29c]">
            {directionLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium text-slate-500">
          {locale === "th" ? `ขนาดพอร์ต (${currency})` : `Account size (${currency})`}
          <input className={inputClass} inputMode="decimal" min="0" onChange={(event) => setAccountSize(event.target.value)} step="any" type="number" value={accountSize} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          {locale === "th" ? "ความเสี่ยงต่อแผน (%)" : "Risk per setup (%)"}
          <input className={inputClass} inputMode="decimal" min="0" onChange={(event) => setRiskPercent(event.target.value)} step="0.1" type="number" value={riskPercent} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          {locale === "th" ? "ราคาเข้า (Entry)" : "Entry price"}
          <input className={inputClass} inputMode="decimal" min="0" onChange={(event) => setEntryPrice(event.target.value)} step="any" type="number" value={entryPrice} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          {locale === "th" ? "จุดตัดขาดทุน (Stop)" : "Stop price"}
          <input className={inputClass} inputMode="decimal" min="0" onChange={(event) => setStopPrice(event.target.value)} step="any" type="number" value={stopPrice} />
          {support != null && support > 0 ? (
            <button className="mt-1.5 text-[11px] text-accent hover:underline" onClick={() => setStopPrice(numberInput(support))} type="button">
              {locale === "th" ? `ใช้แนวรับ ${formatMoney(support)}` : `Use support ${formatMoney(support)}`}
            </button>
          ) : null}
        </label>
        <label className="text-xs font-medium text-slate-500">
          {locale === "th" ? "เป้าหมาย (Target, ไม่บังคับ)" : "Target (optional)"}
          <input className={inputClass} inputMode="decimal" min="0" onChange={(event) => setTargetPrice(event.target.value)} step="any" type="number" value={targetPrice} />
          {resistance != null && resistance > 0 ? (
            <button className="mt-1.5 text-[11px] text-accent hover:underline" onClick={() => setTargetPrice(numberInput(resistance))} type="button">
              {locale === "th" ? `ใช้แนวต้าน ${formatMoney(resistance)}` : `Use resistance ${formatMoney(resistance)}`}
            </button>
          ) : null}
        </label>
      </div>

      {calculation.error ? (
        <div className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
          {locale === "th" ? "กรอกค่าบวกให้ครบ และให้ราคา Stop ต่างจาก Entry" : calculation.error}
        </div>
      ) : null}

      {result ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">{locale === "th" ? "จำนวนหุ้น" : "Shares"}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-white">{result.shares.toLocaleString(dateLocale)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">{locale === "th" ? "งบความเสี่ยง" : "Risk budget"}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-white">{formatMoney(result.riskBudget)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">{locale === "th" ? "ขาดทุนตาม Stop" : "Loss at stop"}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-danger">{formatMoney(result.maxLoss)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">{locale === "th" ? "มูลค่าสถานะ" : "Position value"}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-white">{formatMoney(result.positionValue)}</p>
              <p className="mt-1 text-[11px] text-slate-600">{result.positionPercent.toFixed(1)}% {locale === "th" ? "ของพอร์ต" : "of account"}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">Reward / Risk</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-success">{result.rewardRiskRatio == null ? "—" : `${result.rewardRiskRatio.toFixed(2)} : 1`}</p>
              {result.breakevenWinRate != null ? <p className="mt-1 text-[11px] text-slate-600">BE {result.breakevenWinRate.toFixed(1)}%</p> : null}
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-elevated p-3">
              <p className="text-[11px] uppercase tracking-wider text-slate-600">{locale === "th" ? "กำไรที่ Target" : "Reward at target"}</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-success">{formatMoney(result.potentialReward)}</p>
            </div>
          </div>

          {result.limitedByCapital ? (
            <p className="mt-3 rounded-xl border border-warning/15 bg-warning/5 px-3 py-2 text-xs leading-5 text-warning">
              {locale === "th"
                ? "จำนวนหุ้นถูกจำกัดด้วยเงินสดที่มี ไม่ใช่งบความเสี่ยง เครื่องมือนี้ไม่สมมติ Margin หรือ Leverage"
                : "Share count is capped by available cash rather than the risk budget. This planner does not assume margin or leverage."}
            </p>
          ) : null}
        </>
      ) : null}

      <p className="mt-4 text-[11px] leading-5 text-slate-600">
        {locale === "th"
          ? "เพื่อการศึกษาเท่านั้น การขาดทุนจริงอาจมากกว่า Stop จาก Gap, Slippage, ค่าธรรมเนียม, ภาษี, FX และข้อจำกัดการส่งคำสั่ง แนวรับ/แนวต้านที่เติมให้อัตโนมัติเป็นเพียงค่าจากการวิเคราะห์ ไม่ใช่คำแนะนำซื้อขาย และค่าขนาดพอร์ตที่กรอกจะไม่ถูกบันทึกโดยเครื่องมือนี้"
          : "Educational tool only. Real losses can exceed the stop because of gaps, slippage, fees, taxes, FX, and execution constraints. Suggested support/resistance values are analytical references, not trade recommendations. The account-size input is not persisted by this tool."}
      </p>
    </div>
  );
}
