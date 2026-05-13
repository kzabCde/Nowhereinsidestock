import { ComparePage } from "@/components/compare/ComparePage";
import { buildWinnerSummary, fetchCompareStock } from "@/lib/services/compare";
import type { CompareTimeframe } from "@/lib/types/compare";

type PageProps = { searchParams: Promise<{ symbols?: string; timeframe?: string }> };

const fallbackSymbols = ["AAPL", "MSFT"];
const allowedTimeframes: CompareTimeframe[] = ["1M", "6M", "1Y", "5Y"];

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const timeframe = allowedTimeframes.includes(params.timeframe as CompareTimeframe) ? (params.timeframe as CompareTimeframe) : "1Y";
  const symbols = (params.symbols?.split(",") ?? fallbackSymbols).map((s) => s.trim().toUpperCase()).filter(Boolean).filter((s, i, arr) => arr.indexOf(s) === i).slice(0, 4);
  const results = await Promise.all(symbols.map((symbol) => fetchCompareStock(symbol, timeframe)));
  const validMetrics = results.filter((r) => !r.error).map((r) => r.metrics);
  const summary = validMetrics.length > 0 ? buildWinnerSummary(validMetrics) : null;

  return <ComparePage initialSymbols={symbols} timeframe={timeframe} results={results} summary={summary} />;
}
