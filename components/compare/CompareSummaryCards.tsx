"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function CompareSummaryCards({ summary }: { summary: { bestPerformer: string; lowestVolatility: string; strongestMomentum: string; mostStable: string } | null }) {
  const { t } = useI18n();
  if (!summary) return null;
  const cards = [
    [t("compare.bestPerformer"), summary.bestPerformer],
    [t("compare.lowestVolatility"), summary.lowestVolatility],
    [t("compare.strongestMomentum"), summary.strongestMomentum],
    [t("compare.mostStable"), summary.mostStable]
  ];
  return <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value]) => <article key={label} className="printstream-shell pearl-border rounded-2xl p-4"><p className="text-xs text-slate-300">{label}</p><p className="text-lg font-semibold">{value}</p></article>)}</section>;
}
