"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { dividendDiscountValue, grahamNumber, peFairValue } from "@/lib/finance/valuation";
import { formatMarketCurrency } from "@/lib/format/market";
import type { ValuationMetrics } from "@/lib/types/market";

type ValuationMethod = "pe" | "graham" | "ddm";
type FieldKey = "eps" | "targetPE" | "bookValuePerShare" | "dividendPerShare" | "requiredReturn" | "growthRate";
type ErrorCode = "required" | "positive" | "nonNegative" | "returnAboveGrowth" | "growthBelowReturn";
type Props = { symbol?: string; currentPrice?: number; metrics?: ValuationMetrics; currency?: string };

const METHOD_FIELDS: Record<ValuationMethod, FieldKey[]> = {
  pe: ["eps", "targetPE"],
  graham: ["eps", "bookValuePerShare"],
  ddm: ["dividendPerShare", "requiredReturn", "growthRate"]
};

function toInputValue(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(Number(value.toFixed(4))) : "";
}
function parseInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function getInitialValues(metrics?: ValuationMetrics): Record<FieldKey, string> {
  return {
    eps: toInputValue(metrics?.trailingEps ?? metrics?.forwardEps),
    targetPE: toInputValue(metrics?.forwardPE ?? metrics?.trailingPE),
    bookValuePerShare: toInputValue(metrics?.bookValue),
    dividendPerShare: toInputValue(metrics?.dividendRate),
    requiredReturn: "",
    growthRate: ""
  };
}

function calculate(method: ValuationMethod, values: Record<FieldKey, string>): { fairValue?: number; errors: Partial<Record<FieldKey, ErrorCode>> } {
  const errors: Partial<Record<FieldKey, ErrorCode>> = {};
  const parsed = Object.fromEntries(METHOD_FIELDS[method].map((field) => [field, parseInput(values[field])])) as Partial<Record<FieldKey, number | null>>;
  for (const field of METHOD_FIELDS[method]) if (parsed[field] == null) errors[field] = "required";
  if ((method === "pe" || method === "graham") && parsed.eps != null && parsed.eps <= 0) errors.eps = "positive";
  if (method === "pe" && parsed.targetPE != null && parsed.targetPE <= 0) errors.targetPE = "positive";
  if (method === "graham" && parsed.bookValuePerShare != null && parsed.bookValuePerShare <= 0) errors.bookValuePerShare = "positive";
  if (method === "ddm" && parsed.dividendPerShare != null && parsed.dividendPerShare < 0) errors.dividendPerShare = "nonNegative";
  if (method === "ddm" && parsed.requiredReturn != null && parsed.growthRate != null && parsed.requiredReturn <= parsed.growthRate) {
    errors.requiredReturn = "returnAboveGrowth";
    errors.growthRate = "growthBelowReturn";
  }
  if (Object.keys(errors).length) return { errors };
  let fairValue: number | null = null;
  if (method === "pe") fairValue = peFairValue(parsed.eps!, parsed.targetPE!);
  if (method === "graham") fairValue = grahamNumber(parsed.eps!, parsed.bookValuePerShare!);
  if (method === "ddm") fairValue = dividendDiscountValue(parsed.dividendPerShare!, parsed.requiredReturn!, parsed.growthRate!);
  return fairValue == null ? { errors } : { fairValue, errors };
}

export function FairValueCalculator({ symbol, currentPrice, metrics, currency = "USD" }: Props) {
  const [method, setMethod] = useState<ValuationMethod>("pe");
  const [values, setValues] = useState<Record<FieldKey, string>>(() => getInitialValues(metrics));
  const { locale, t } = useI18n();
  const th = locale === "th";
  const result = useMemo(() => calculate(method, values), [method, values]);
  const differencePercent = typeof result.fairValue === "number" && typeof currentPrice === "number" && currentPrice > 0 ? ((result.fairValue - currentPrice) / currentPrice) * 100 : undefined;

  const methods: Record<ValuationMethod, { label: string; formula: string; explanation: string }> = {
    pe: { label: t("fairValue.peMethod"), formula: "Fair Value = EPS × Target P/E", explanation: th ? "ใช้กำไรต่อหุ้นคูณกับ P/E เป้าหมายเพื่อสร้างกรอบประเมินมูลค่าจากความสามารถในการทำกำไร" : "Uses earnings per share multiplied by a target P/E to frame value from earnings power." },
    graham: { label: t("fairValue.graham"), formula: "Graham Number = √(22.5 × EPS × Book Value Per Share)", explanation: th ? "สูตรเชิงอนุรักษ์นิยมที่ผสม EPS กับมูลค่าทางบัญชีต่อหุ้น" : "A conservative formula combining EPS with book value per share." },
    ddm: { label: t("fairValue.ddm"), formula: "DDM Value = Dividend per Share ÷ (Required Return − Growth Rate)", explanation: th ? "ประเมินมูลค่าจากเงินปันผล โดยผลตอบแทนที่ต้องการต้องสูงกว่าอัตราการเติบโต" : "Values expected dividends where required return must exceed long-term growth." }
  };
  const labels: Record<FieldKey, string> = {
    eps: t("fairValue.eps"), targetPE: t("fairValue.targetPe"), bookValuePerShare: t("fairValue.bookValue"), dividendPerShare: t("fairValue.dividend"), requiredReturn: t("fairValue.requiredReturn"), growthRate: t("fairValue.growth")
  };
  const helpers: Record<FieldKey, string> = {
    eps: th ? "ต้องมากกว่า 0 หากไม่มีข้อมูลให้กรอกสมมติฐานเอง" : "Must be above 0; enter your own assumption if provider data is unavailable.",
    targetPE: th ? "ใช้ trailing/forward P/E เป็นจุดเริ่มต้นแล้วปรับตามสมมติฐาน" : "Use trailing/forward P/E as a starting point and adjust to your assumptions.",
    bookValuePerShare: th ? "ต้องมากกว่า 0" : "Must be above 0.",
    dividendPerShare: th ? "เงินปันผลต่อหุ้นรายปี" : "Annual dividend per share.",
    requiredReturn: th ? "กรอกเป็นเปอร์เซ็นต์ เช่น 10 หมายถึง 10%" : "Enter a percentage, e.g. 10 means 10%.",
    growthRate: th ? "กรอกเป็นเปอร์เซ็นต์ เช่น 3 หมายถึง 3%" : "Enter a percentage, e.g. 3 means 3%."
  };
  const errorText = (code: ErrorCode) => ({
    required: th ? "กรุณากรอกตัวเลขที่ถูกต้อง" : "Enter a valid number.",
    positive: th ? "ค่าต้องมากกว่า 0" : "Value must be above 0.",
    nonNegative: th ? "ค่าต้องไม่ติดลบ" : "Value cannot be negative.",
    returnAboveGrowth: th ? "ผลตอบแทนที่ต้องการต้องมากกว่าอัตราเติบโต" : "Required return must exceed growth rate.",
    growthBelowReturn: th ? "อัตราเติบโตต้องต่ำกว่าผลตอบแทนที่ต้องการ" : "Growth rate must be below required return."
  }[code]);
  const marketComparison = differencePercent == null || !Number.isFinite(differencePercent)
    ? (th ? "กรอกข้อมูลให้ครบเพื่อเปรียบเทียบกับราคาตลาด" : "Complete the inputs to compare with market price.")
    : differencePercent > 0
      ? (th ? "ราคาตลาดต่ำกว่าค่าประเมินตามสมมติฐานนี้ ควรศึกษาปัจจัยอื่นเพิ่มเติม" : "Market price is below this assumption-based estimate; investigate further.")
      : differencePercent < 0
        ? (th ? "ราคาตลาดสูงกว่าค่าประเมินตามสมมติฐานนี้ ควรศึกษาปัจจัยอื่นเพิ่มเติม" : "Market price is above this assumption-based estimate; investigate further.")
        : (th ? "ราคาตลาดใกล้ค่าประเมินตามสมมติฐานนี้" : "Market price is near this assumption-based estimate.");

  return (
    <section id="valuation" className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="section-kicker">{t("fairValue.eyebrow")}</p><h2 className="mt-1 text-2xl font-bold text-white">{t("fairValue.title")}{symbol ? `: ${symbol}` : ""}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t("fairValue.description")} ({currency})</p></div>
        <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">{th ? "เพื่อการศึกษา ไม่ใช่คำแนะนำลงทุน" : "Educational, not investment advice"}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-sm font-medium text-slate-200" htmlFor="valuation-method">{th ? "เลือกสูตร" : "Formula selector"}</label>
          <select id="valuation-method" value={method} onChange={(event) => setMethod(event.target.value as ValuationMethod)} className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/70">
            {(Object.keys(methods) as ValuationMethod[]).map((key) => <option key={key} value={key}>{methods[key].label}</option>)}
          </select>
          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3"><p className="text-sm font-semibold text-cyan-100">{methods[method].formula}</p><p className="mt-1 text-sm leading-6 text-slate-300">{methods[method].explanation}</p></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {METHOD_FIELDS[method].map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-200" htmlFor={`valuation-${field}`}>{labels[field]}</label>
                <input id={`valuation-${field}`} inputMode="decimal" type="number" step="any" value={values[field]} onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/70" placeholder={th ? "กรอกตัวเลข" : "Enter a number"} />
                {result.errors[field] ? <p className="text-xs text-rose-200">{errorText(result.errors[field]!)}</p> : <p className="text-xs text-slate-400">{helpers[field]}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm text-slate-400">{t("fairValue.estimate")}</p><p className="mt-1 text-3xl font-extrabold text-white">{formatMarketCurrency(result.fairValue, currency)}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm text-slate-400">{t("fairValue.currentPrice")}</p><p className="mt-1 text-3xl font-extrabold text-white">{formatMarketCurrency(currentPrice, currency)}</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4"><p className="text-sm text-slate-400">{t("fairValue.upside")}</p><p className={`mt-1 text-3xl font-extrabold ${differencePercent != null && differencePercent >= 0 ? "text-emerald-200" : "text-rose-200"}`}>{differencePercent == null ? "—" : `${differencePercent >= 0 ? "+" : ""}${differencePercent.toFixed(2)}%`}</p><p className="mt-2 text-sm leading-6 text-slate-300">{marketComparison}</p></div>
          <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">{th ? "ผลลัพธ์ขึ้นอยู่กับสมมติฐาน ควรพิจารณางบการเงิน ความเสี่ยง สภาพคล่อง และบริบทธุรกิจร่วมด้วย" : "Results depend on your assumptions. Consider financial statements, risk, liquidity, and business context as well."}</div>
        </div>
      </div>
    </section>
  );
}
