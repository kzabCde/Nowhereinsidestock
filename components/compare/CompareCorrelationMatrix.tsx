import { buildCorrelationMatrix } from "@/lib/finance/correlation";
import type { CompareSeries } from "@/lib/types/compare";

function describe(value: number | null): string {
  if (value == null) return "Insufficient overlap";
  const absolute = Math.abs(value);
  if (absolute >= 0.8) return value > 0 ? "Very strong positive" : "Very strong negative";
  if (absolute >= 0.5) return value > 0 ? "Moderate positive" : "Moderate negative";
  if (absolute >= 0.2) return value > 0 ? "Weak positive" : "Weak negative";
  return "Low correlation";
}

export function CompareCorrelationMatrix({ series }: { series: CompareSeries[] }) {
  const matrix = buildCorrelationMatrix(series.map((item) => ({ symbol: item.symbol, points: item.points.map((point) => ({ date: point.date, close: point.close })) })));
  if (series.length < 2) return null;

  return (
    <section className="rounded-3xl border border-white/[0.08] bg-surface p-4 sm:p-5">
      <div>
        <p className="section-kicker">Diversification</p>
        <h2 className="mt-1.5 text-xl font-bold text-white">Return correlation matrix</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Pearson correlation is calculated from aligned daily percentage returns, not raw price levels. Values near +1 move together; values near -1 tend to move oppositely.</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08]">
        <table className="w-full min-w-[520px] text-center text-sm">
          <thead className="bg-elevated text-xs uppercase tracking-wider text-slate-500">
            <tr><th className="p-3 text-left">Symbol</th>{series.map((item) => <th key={item.symbol} className="p-3">{item.symbol}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {matrix.map((row) => (
              <tr key={row.symbol}>
                <th className="p-3 text-left font-semibold text-white">{row.symbol}</th>
                {series.map((column) => {
                  const value = row.values[column.symbol] ?? null;
                  return <td key={column.symbol} className="p-3 text-slate-300" title={describe(value)}>{value == null ? "—" : value.toFixed(3)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-600">Correlation is historical and can change across market regimes. It is not a guarantee of future diversification.</p>
    </section>
  );
}
