export type Holding = { key: string; symbol: string; currency: string; quantity: number; cost: number };
export type HoldingQuote = { latestPrice: number; currency?: string };
type Exclusion = "missing-quote" | "invalid-quote" | "currency-mismatch";

type CurrencyValuation = {
  cost: number;
  comparableCost: number;
  comparableMarketValue: number;
  valued: number;
  excluded: number;
};

export function valuePortfolio<T extends Holding>(holdings: T[], quotes: Readonly<Record<string, HoldingQuote | undefined>>) {
  const totals = new Map<string, CurrencyValuation>();
  const positions = holdings.map((holding) => {
    const quote = quotes[holding.symbol];
    const marketCurrency = quote?.currency;
    const rawValue = quote && quote.latestPrice * holding.quantity;
    let exclusion: Exclusion | null = null;
    if (!quote) exclusion = "missing-quote";
    else if (!marketCurrency || !Number.isFinite(rawValue) || quote.latestPrice <= 0) exclusion = "invalid-quote";
    else if (marketCurrency !== holding.currency) exclusion = "currency-mismatch";

    const marketValue = exclusion ? null : rawValue ?? null;
    const pnl = marketValue == null ? null : marketValue - holding.cost;
    const total = totals.get(holding.currency) ?? {
      cost: 0, comparableCost: 0, comparableMarketValue: 0, valued: 0, excluded: 0
    };
    total.cost += holding.cost;
    if (marketValue == null) {
      total.excluded += 1;
    } else {
      total.valued += 1;
      total.comparableCost += holding.cost;
      total.comparableMarketValue += marketValue;
    }
    totals.set(holding.currency, total);
    return { ...holding, marketCurrency, marketValue, exclusion, pnl, pnlPercent: pnl != null && holding.cost > 0 ? pnl / holding.cost * 100 : null };
  });
  const currencies = [...totals].map(([currency, value]) => ({
    currency,
    ...value,
    unrealized: value.valued ? value.comparableMarketValue - value.comparableCost : null,
    status: value.valued === 0 ? "unavailable" as const : value.excluded ? "partial" as const : "complete" as const
  }));
  const valued = positions.filter((holding) => holding.exclusion == null).length;
  const status = !valued ? "unavailable" : valued < positions.length ? "partial" : "complete";
  return { positions, currencies, status };
}
