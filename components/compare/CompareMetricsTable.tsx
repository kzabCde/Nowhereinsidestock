import type { CompareSeries } from "@/lib/types/compare";
import { SectionCard } from "@/components/ui/SectionCard";

export function CompareMetricsTable({ series }: { series: CompareSeries[] }) {
  return (
    <SectionCard>
      <div className="mb-4">
        <p className="section-kicker">Metrics</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Summary table</h2>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr><th className="p-3">Symbol</th><th className="p-3">Latest price</th><th className="p-3">Total return</th><th className="p-3">Volatility</th><th className="p-3">Trend</th><th className="p-3">RSI</th><th className="p-3">MACD</th><th className="p-3">Avg volume</th></tr>
          </thead>
          <tbody>
            {series.map((s) => (
              <tr key={s.symbol} className="border-t border-white/10 text-slate-200">
                <td className="p-3 font-semibold text-white">{s.symbol}</td><td className="p-3">${s.metrics.latestPrice.toFixed(2)}</td><td className="p-3">{s.metrics.totalReturn.toFixed(2)}%</td><td className="p-3">{s.metrics.volatility.toFixed(2)}%</td><td className="p-3">{s.metrics.trend}</td><td className="p-3">{s.metrics.rsiSignal ?? "-"}</td><td className="p-3">{s.metrics.macdSignal ?? "-"}</td><td className="p-3">{Math.round(s.metrics.averageVolume ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
