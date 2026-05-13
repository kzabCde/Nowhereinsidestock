import type { CompareTimeframe } from "@/lib/types/compare";

type Props = { symbols: string[]; timeframe: CompareTimeframe };
const timeframes: CompareTimeframe[] = ["1M", "6M", "1Y", "5Y"];

export function CompareTimeframeTabs({ symbols, timeframe }: Props) {
  return <div className="mt-3 flex gap-2">{timeframes.map((tf) => <a key={tf} className={`rounded-lg px-3 py-1 text-sm ${tf===timeframe?"bg-white/20":"bg-white/5"}`} href={`/compare?symbols=${symbols.join(",")}&timeframe=${tf}`}>{tf}</a>)}</div>;
}
