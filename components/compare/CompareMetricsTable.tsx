import type { CompareSeries } from "@/lib/types/compare";

export function CompareMetricsTable({ series }: { series: CompareSeries[] }) {
  return <section className="printstream-shell pearl-border rounded-3xl p-4"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr><th>symbol</th><th>latest price</th><th>total return %</th><th>volatility</th><th>trend</th><th>RSI</th><th>MACD</th><th>avg volume</th></tr></thead><tbody>{series.map((s) => <tr key={s.symbol} className="border-t border-white/10"><td>{s.symbol}</td><td>{s.metrics.latestPrice.toFixed(2)}</td><td>{s.metrics.totalReturn.toFixed(2)}%</td><td>{s.metrics.volatility.toFixed(2)}%</td><td>{s.metrics.trend}</td><td>{s.metrics.rsiSignal ?? "-"}</td><td>{s.metrics.macdSignal ?? "-"}</td><td>{Math.round(s.metrics.averageVolume ?? 0).toLocaleString()}</td></tr>)}</tbody></table></div></section>;
}
