"use client";

import { useMemo, useState } from "react";
import type { ValuationMetrics } from "@/lib/types/market";

type ValuationMethod = "pe" | "graham" | "ddm";
type FieldKey = "eps" | "targetPE" | "bookValuePerShare" | "dividendPerShare" | "requiredReturn" | "growthRate";

type FairValueCalculatorProps = {
  symbol?: string;
  currentPrice?: number;
  metrics?: ValuationMetrics;
};

type MethodConfig = {
  label: string;
  formula: string;
  explanation: string;
  fields: FieldKey[];
};

const METHOD_CONFIG: Record<ValuationMethod, MethodConfig> = {
  pe: {
    label: "P/E Valuation",
    formula: "Fair Value = EPS × Target P/E",
    explanation: "สูตร P/E ใช้กำไรต่อหุ้นคูณกับค่า P/E เป้าหมาย เพื่อประเมินมูลค่าจากความสามารถในการทำกำไรของบริษัท",
    fields: ["eps", "targetPE"]
  },
  graham: {
    label: "Graham Number",
    formula: "Graham Number = √(22.5 × EPS × Book Value Per Share)",
    explanation: "Graham Number เป็นสูตรเชิงอนุรักษ์นิยมที่ผสมกำไรต่อหุ้นกับมูลค่าทางบัญชีต่อหุ้น เพื่อใช้เป็นกรอบศึกษามูลค่าพื้นฐาน",
    fields: ["eps", "bookValuePerShare"]
  },
  ddm: {
    label: "Dividend Discount Model",
    formula: "DDM Value = Dividend per Share ÷ (Required Return − Growth Rate)",
    explanation: "Dividend Discount Model ประเมินมูลค่าจากเงินปันผลคาดหวัง โดยเปรียบเทียบผลตอบแทนที่ต้องการกับอัตราการเติบโตระยะยาว",
    fields: ["dividendPerShare", "requiredReturn", "growthRate"]
  }
};

const FIELD_LABELS: Record<FieldKey, string> = {
  eps: "EPS",
  targetPE: "Target P/E",
  bookValuePerShare: "Book Value Per Share",
  dividendPerShare: "Dividend per Share",
  requiredReturn: "Required return %",
  growthRate: "Growth rate %"
};

const FIELD_HELPERS: Record<FieldKey, string> = {
  eps: "ต้องมากกว่า 0 หากไม่มีข้อมูลจาก Yahoo Finance กรุณากรอกเอง",
  targetPE: "สามารถใช้ trailing/forward P/E เป็นจุดเริ่มต้น แล้วปรับตามสมมติฐานของคุณ",
  bookValuePerShare: "ต้องมากกว่า 0 หากไม่มีข้อมูลจาก Yahoo Finance กรุณากรอกเอง",
  dividendPerShare: "เงินปันผลต่อหุ้นรายปี หากไม่มีข้อมูลให้เว้นว่างหรือกรอกสมมติฐานเอง",
  requiredReturn: "กรอกเป็นเปอร์เซ็นต์ เช่น 10 หมายถึง 10%",
  growthRate: "กรอกเป็นเปอร์เซ็นต์ เช่น 3 หมายถึง 3%"
};

const DEFAULT_VALUES: Record<FieldKey, string> = {
  eps: "",
  targetPE: "",
  bookValuePerShare: "",
  dividendPerShare: "",
  requiredReturn: "",
  growthRate: ""
};

function toInputValue(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? String(Number(value.toFixed(4))) : "";
}

function parseInput(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
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

function validateAndCalculate(method: ValuationMethod, values: Record<FieldKey, string>): { fairValue?: number; errors: Partial<Record<FieldKey, string>> } {
  const errors: Partial<Record<FieldKey, string>> = {};
  const numberValues = METHOD_CONFIG[method].fields.reduce<Partial<Record<FieldKey, number | null>>>((acc, field) => {
    acc[field] = parseInput(values[field]);
    return acc;
  }, {});

  for (const field of METHOD_CONFIG[method].fields) {
    if (numberValues[field] == null) {
      errors[field] = "กรุณากรอกตัวเลขที่ถูกต้อง";
    }
  }

  const eps = numberValues.eps;
  if ((method === "pe" || method === "graham") && eps != null && eps <= 0) {
    errors.eps = "EPS ต้องมากกว่า 0";
  }

  const bookValuePerShare = numberValues.bookValuePerShare;
  if (method === "graham" && bookValuePerShare != null && bookValuePerShare <= 0) {
    errors.bookValuePerShare = "Book value ต้องมากกว่า 0";
  }

  const targetPE = numberValues.targetPE;
  if (method === "pe" && targetPE != null && targetPE <= 0) {
    errors.targetPE = "Target P/E ต้องมากกว่า 0";
  }

  const dividendPerShare = numberValues.dividendPerShare;
  if (method === "ddm" && dividendPerShare != null && dividendPerShare < 0) {
    errors.dividendPerShare = "Dividend per share ต้องไม่ติดลบ";
  }

  const requiredReturn = numberValues.requiredReturn;
  const growthRate = numberValues.growthRate;
  if (method === "ddm" && requiredReturn != null && growthRate != null && requiredReturn <= growthRate) {
    errors.requiredReturn = "Required return ต้องมากกว่า Growth rate";
    errors.growthRate = "Growth rate ต้องน้อยกว่า Required return";
  }

  if (Object.keys(errors).length > 0) return { errors };

  if (method === "pe" && eps != null && targetPE != null) {
    return { fairValue: eps * targetPE, errors };
  }

  if (method === "graham" && eps != null && bookValuePerShare != null) {
    return { fairValue: Math.sqrt(22.5 * eps * bookValuePerShare), errors };
  }

  if (method === "ddm" && dividendPerShare != null && requiredReturn != null && growthRate != null) {
    return { fairValue: dividendPerShare / ((requiredReturn - growthRate) / 100), errors };
  }

  return { errors };
}

export function FairValueCalculator({ symbol, currentPrice, metrics }: FairValueCalculatorProps) {
  const [method, setMethod] = useState<ValuationMethod>("pe");
  const [values, setValues] = useState<Record<FieldKey, string>>(() => ({ ...DEFAULT_VALUES, ...getInitialValues(metrics) }));

  const result = useMemo(() => validateAndCalculate(method, values), [method, values]);
  const differencePercent =
    typeof result.fairValue === "number" && typeof currentPrice === "number" && currentPrice > 0
      ? ((result.fairValue - currentPrice) / currentPrice) * 100
      : undefined;

  const marketComparison = useMemo(() => {
    if (differencePercent == null || !Number.isFinite(differencePercent)) return "กรุณากรอกข้อมูลให้ครบเพื่อเปรียบเทียบกับราคาตลาด";
    if (differencePercent > 0) return "ราคาตลาดปัจจุบันต่ำกว่าราคาประเมิน — ควรศึกษาเพิ่มเติม";
    if (differencePercent < 0) return "ราคาตลาดปัจจุบันสูงกว่าราคาประเมิน — ควรศึกษาเพิ่มเติม";
    return "ราคาตลาดปัจจุบันใกล้เคียงราคาประเมิน — ควรศึกษาเพิ่มเติม";
  }, [differencePercent]);

  const updateField = (field: FieldKey, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <section id="valuation" className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm tracking-[0.3em] text-cyan-200/80">VALUATION</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Fair Value Calculator{symbol ? `: ${symbol}` : ""}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            เครื่องมือนี้ช่วยคำนวณ “ราคาประเมินตามสูตร” จากสมมติฐานที่แก้ไขได้ เพื่อใช้เป็นกรอบเรียนรู้การประเมินมูลค่าหุ้น
          </p>
        </div>
        <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100">
          ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <label className="block text-sm font-medium text-slate-200" htmlFor="valuation-method">
            Formula selector
          </label>
          <select
            id="valuation-method"
            value={method}
            onChange={(event) => setMethod(event.target.value as ValuationMethod)}
            className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-300/70"
          >
            {Object.entries(METHOD_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
            <p className="text-sm font-semibold text-cyan-100">{METHOD_CONFIG[method].formula}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{METHOD_CONFIG[method].explanation}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {METHOD_CONFIG[method].fields.map((field) => (
              <div key={field} className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-200" htmlFor={`valuation-${field}`}>{FIELD_LABELS[field]}</label>
                <input
                  id={`valuation-${field}`}
                  inputMode="decimal"
                  type="number"
                  step="any"
                  value={values[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70"
                  placeholder="กรอกตัวเลข"
                />
                {result.errors[field] ? <p className="text-xs text-rose-200">{result.errors[field]}</p> : <p className="text-xs text-slate-400">{FIELD_HELPERS[field]}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">ราคาประเมินตามสูตร</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{formatCurrency(result.fairValue)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm text-slate-400">ราคาตลาดปัจจุบัน</p>
              <p className="mt-1 text-3xl font-extrabold text-white">{formatCurrency(currentPrice)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-slate-400">ส่วนต่างจากราคาตลาด</p>
              <p className={`mt-1 text-3xl font-extrabold ${differencePercent != null && differencePercent >= 0 ? "text-emerald-200" : "text-rose-200"}`}>
                {differencePercent == null ? "—" : `${differencePercent >= 0 ? "+" : ""}${differencePercent.toFixed(2)}%`}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{marketComparison}</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-50">
            ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน ผลลัพธ์ขึ้นอยู่กับสมมติฐานที่กรอก และควรศึกษาเพิ่มเติมจากงบการเงิน ความเสี่ยง และบริบทของธุรกิจ
          </div>
        </div>
      </div>
    </section>
  );
}
