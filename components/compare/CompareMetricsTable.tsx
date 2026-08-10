import { SectionCard } from "@/components/ui/SectionCard";
import { formatMarketCurrency } from "@/lib/format/market";
import type { CompareSeries } from "@/lib/types/compare";

function metric(value: number | undefined, suffix = ""): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}${suffix}` : "—";
}

export function CompareMetricsTable({ series }: { series: CompareSeries[] }) {
  return (
    <SectionCard>
      <div className="mb-4">
        <p className="section-kicker">Metrics</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Risk & performance summary</h2>
        <p className="mt-1 text-sm text-slate-500">Volatility is annualized from daily returns. Sharpe and Sortino use a 0% default risk-free/target rate for relative comparison.</p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.14em] text-slate-500">
            <tr>
              <th className="p-3">Symbol</th>
              <th className="p-3">Latest</th>
              <th className="p-3">Return</th>
              <th className="p-3">Volatility</th>
              <th className="p-3">Max DD</th>
              <th className="p-3">Sharpe</th>
              <th className="p-3">Sortino</th>
              <th className="p-3">Momentum</th>
              <th className="p-3">Trend</th>
              <th className="p-3">RSI</th>
              <th className="p-3">MACD</th>
              <th className="p-3">Avg volume</th>
            </tr>
          </thead>
          <tbody>
            {series.map((item) => (
              <tr key={item.symbol} className="border-t border-white/10 text-slate-200">
                <td className="p-3 font-semibold text-white">{item.symbol}</td>
                <td className="p-3">{formatMarketCurrency(item.metrics.latestPrice, item.metrics.currency ?? "USD")}</td>
                <td className="p-3">{metric(item.metrics.totalReturn, "%")}</td>
                <td className="p-3">{metric(item.metrics.volatility, "%")}</td>
                <td className="p-3">{metric(item.metrics.maxDrawdown, "%")}</td>
                <td className="p-3">{metric(item.metrics.sharpeRatio)}</td>
                <td className="p-3">{metric(item.metrics.sortinoRatio)}</td>
                <td className="p-3">{metric(item.metrics.momentumScore, "%")}</td>
                <td className="p-3">{item.metrics.trend}</td>
                <td className="p-3">{item.metrics.rsiSignal ?? "—"}</td>
                <td className="p-3">{item.metrics.macdSignal ?? "—"}</td>
                <td className="p-3">{Math.round(item.metrics.averageVolume ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
