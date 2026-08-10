"use client";

import { Radar } from "lucide-react";
import { buildNextSignals, getNearestResistance, getNearestSupport } from "@/lib/analysis/next-signal";
import { buildSignalScore } from "@/lib/analysis/signal-score";
import { useI18n } from "@/components/i18n/I18nProvider";
import { translateEvidence, translateIndicatorContext, translateMovingAverageContext, translateNextSignal, translateTrendContext, translateVolumeContext } from "@/lib/i18n/analysis";
import { formatMarketCurrency } from "@/lib/format/market";
import type { MovingAverages, PriceZone } from "@/lib/types/market";

type NextSignalPanelProps = {
  symbol: string;
  latestPrice: number;
  currency?: string;
  changePercent: number;
  trend: "uptrend" | "downtrend" | "sideway";
  movingAverages?: MovingAverages;
  supportResistance?: { supports: PriceZone[]; resistances: PriceZone[] };
  rsiSignal?: string;
  macdSignal?: string;
  momentumScore?: number;
  volume?: number | null;
  averageVolume?: number | null;
};

const toneClass: Record<"positive" | "neutral" | "negative" | "warning", string> = {
  positive: "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
  neutral: "border-slate-300/15 bg-white/[0.04] text-slate-100",
  negative: "border-rose-300/25 bg-rose-400/10 text-rose-100",
  warning: "border-amber-300/25 bg-amber-400/10 text-amber-100"
};

export function NextSignalPanel({
  symbol,
  latestPrice,
  currency = "USD",
  changePercent,
  trend,
  movingAverages,
  supportResistance,
  rsiSignal,
  macdSignal,
  momentumScore,
  volume,
  averageVolume
}: NextSignalPanelProps) {
  const { locale, t } = useI18n();
  const supports = supportResistance?.supports ?? [];
  const resistances = supportResistance?.resistances ?? [];
  const signals = buildNextSignals({ latestPrice, trend, movingAverages, supportResistance, rsiSignal, macdSignal, volume, averageVolume });
  const score = buildSignalScore({ latestPrice, trend, movingAverages, rsiSignal, macdSignal, momentumScore, volume, averageVolume, supports, resistances });
  const nearestSupport = getNearestSupport(latestPrice, supports);
  const nearestResistance = getNearestResistance(latestPrice, resistances);
  const scoreTone = score.stance === "bullish" ? "text-success" : score.stance === "bearish" ? "text-danger" : "text-warning";
  const stanceLabel = locale === "th"
    ? ({ bullish: "เชิงบวก", neutral: "เป็นกลาง", bearish: "เชิงลบ" } as const)[score.stance]
    : score.stance;
  const confidenceLabel = locale === "th"
    ? ({ high: "สูง", medium: "ปานกลาง", low: "ต่ำ" } as const)[score.confidence]
    : score.confidence;

  return (
    <section className="printstream-shell pearl-border w-full max-w-full min-w-0 overflow-hidden rounded-3xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t("next.eyebrow")}</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-white"><Radar className="text-cyan-100" size={22} /> {t("next.title")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{t("next.description", { symbol })}</p>
        </div>
        <span className={`w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold ${changePercent >= 0 ? "text-success" : "text-danger"}`}>{formatMarketCurrency(latestPrice, currency)} • {changePercent >= 0 ? "+" : ""}{changePercent.toFixed(2)}%</span>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-2xl border border-white/10 bg-elevated p-4">
          <p className="section-kicker">{t("next.score")}</p>
          <p className={`mt-2 text-5xl font-black tabular-nums ${scoreTone}`}>{score.score}<span className="text-lg text-slate-600">/100</span></p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{stanceLabel}</span>
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-slate-300">{t("next.confidence")}: {confidenceLabel}</span>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <p className="section-kicker">{t("next.supporting")}</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-300">
              {score.reasons.length > 0 ? score.reasons.map((reason) => <li key={`${reason.code}-${reason.value ?? ""}`}>+ {translateEvidence(locale, reason)}</li>) : <li>{locale === "th" ? "ยังไม่มีหลักฐานเชิงบวกที่เด่นชัด" : "No strong positive evidence yet."}</li>}
            </ul>
          </div>
          <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4">
            <p className="section-kicker">{t("next.cautions")}</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-300">
              {score.cautions.length > 0 ? score.cautions.map((caution) => <li key={`${caution.code}-${caution.value ?? ""}`}>− {translateEvidence(locale, caution)}</li>) : <li>{locale === "th" ? "ยังไม่พบข้อควรระวังทางเทคนิคที่เด่นชัด" : "No major technical caution detected."}</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <p className="section-kicker">{t("next.currentContext")}</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
          <li>{translateTrendContext(locale, trend)}</li>
          <li>{translateMovingAverageContext(locale, movingAverages)}</li>
          <li>{translateIndicatorContext(locale, rsiSignal, macdSignal)}</li>
          <li>{translateVolumeContext(locale, volume, averageVolume)}</li>
        </ul>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">{t("next.nearestSupport")}</p><p className="mt-1 text-base font-semibold text-white">{formatMarketCurrency(nearestSupport?.level, currency)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-xs text-slate-400">{t("next.nearestResistance")}</p><p className="mt-1 text-base font-semibold text-white">{formatMarketCurrency(nearestResistance?.level, currency)}</p></div>
        </div>
      </div>

      <div className="mt-5">
        <p className="section-kicker">{t("next.title")}</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {signals.map((signal) => {
            const copy = translateNextSignal(locale, signal.code);
            return <article key={signal.code} className={`rounded-2xl border p-4 ${toneClass[signal.tone]}`}><h4 className="text-base font-semibold text-white">{copy.title}</h4><p className="mt-2 text-sm leading-6 text-slate-200">{copy.description}</p></article>;
          })}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100">{t("next.educational")}</div>
    </section>
  );
}
