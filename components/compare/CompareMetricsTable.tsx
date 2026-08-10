"use client";

import { SectionCard } from "@/components/ui/SectionCard";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatMarketCurrency } from "@/lib/format/market";
import { macdLabel, rsiLabel, trendLabel } from "@/lib/i18n/market-labels";
import type { CompareSeries } from "@/lib/types/compare";

function metric(value: number | undefined, suffix = ""): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}${suffix}` : "—";
}

export function CompareMetricsTable({ series }: { series: CompareSeries[] }) {
  const { locale, t } = useI18n();
  return (
    <SectionCard>
      <div className="mb-4">
        <p className="section-kicker">{t("compare.metrics")}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{locale === "th" ? "สรุปผลตอบแทนและความเสี่ยง" : "Risk & performance summary"}</h2>
        <p className="mt-1 text-sm text-slate-500">{locale === "th" ? "ความผันผวนคำนวณแบบ annualized จากผลตอบแทนรายวัน ส่วน Sharpe และ Sortino ใช้อัตราปลอดความเสี่ยง/ผลตอบแทนเป้าหมายเริ่มต้นที่ 0% เพื่อเปรียบเทียบเชิงสัมพัทธ์" : "Volatility is annualized from daily returns. Sharpe and Sortino use a 0% default risk-free/target rate for relative comparison."}</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500"><tr><th className="p-3">{t("common.symbol")}</th><th className="p-3">{locale === "th" ? "ล่าสุด" : "Latest"}</th><th className="p-3">{t("compare.totalReturn")}</th><th className="p-3">{t("compare.volatility")}</th><th className="p-3">{t("compare.maxDrawdown")}</th><th className="p-3">{t("compare.sharpe")}</th><th className="p-3">{t("compare.sortino")}</th><th className="p-3">{t("stock.momentum")}</th><th className="p-3">{t("common.trend")}</th><th className="p-3">RSI</th><th className="p-3">MACD</th><th className="p-3">{locale === "th" ? "Volume เฉลี่ย" : "Avg volume"}</th></tr></thead>
          <tbody>
            {series.map((item) => (
              <tr key={item.symbol} className="border-t border-white/10 text-slate-200">
                <td className="p-3 font-semibold text-white">{item.symbol}</td><td className="p-3">{formatMarketCurrency(item.metrics.latestPrice, item.metrics.currency ?? "USD")}</td><td className="p-3">{metric(item.metrics.totalReturn, "%")}</td><td className="p-3">{metric(item.metrics.volatility, "%")}</td><td className="p-3">{metric(item.metrics.maxDrawdown, "%")}</td><td className="p-3">{metric(item.metrics.sharpeRatio)}</td><td className="p-3">{metric(item.metrics.sortinoRatio)}</td><td className="p-3">{metric(item.metrics.momentumScore, "%")}</td><td className="p-3">{trendLabel(locale, item.metrics.trend)}</td><td className="p-3">{rsiLabel(locale, item.metrics.rsiSignal)}</td><td className="p-3">{macdLabel(locale, item.metrics.macdSignal)}</td><td className="p-3">{Math.round(item.metrics.averageVolume ?? 0).toLocaleString(locale === "th" ? "th-TH" : "en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
