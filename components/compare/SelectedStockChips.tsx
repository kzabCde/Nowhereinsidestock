"use client";

type Props = { symbols: string[]; onRemove: (symbol: string) => void };

export function SelectedStockChips({ symbols, onRemove }: Props) {
  return <div className="mt-4 flex flex-wrap gap-2">{symbols.map((symbol) => <button key={symbol} onClick={() => onRemove(symbol)} className="rounded-full border border-cyan-300/60 bg-white/10 px-3 py-1 text-xs glow-soft">{symbol} ✕</button>)}</div>;
}
