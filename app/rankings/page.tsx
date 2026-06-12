import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

const rankingCards = [
  { slug: "top-gainers", title: "Top Gainers", description: "Best % gainers from curated liquid US stocks.", label: "Momentum" },
  { slug: "top-losers", title: "Top Losers", description: "Largest % decliners from curated liquid US stocks.", label: "Pressure" },
  { slug: "most-active", title: "Most Active", description: "Stocks with the highest trading activity right now.", label: "Volume" },
  { slug: "highest-market-cap", title: "Highest Market Cap", description: "Largest companies ranked by market capitalization.", label: "Scale" },
  { slug: "highest-volume", title: "Highest Volume", description: "Biggest raw trading volume in current session.", label: "Liquidity" },
  { slug: "strongest-momentum", title: "Strongest Momentum", description: "Blend of change percent and trading volume score.", label: "Trend" },
  { slug: "lowest-volatility", title: "Lowest Volatility", description: "Most stable movers based on low absolute daily change.", label: "Stability" },
  { slug: "magnificent-seven", title: "Magnificent Seven", description: "Performance ranking across the Magnificent Seven names.", label: "Big Tech" },
  { slug: "thai-stocks", title: "Thai Stocks", description: "Top Thai stock movers from curated SET large caps.", label: "SET" },
  { slug: "ai-tech", title: "AI / Tech", description: "Leading AI and technology stocks ranked by performance.", label: "AI" }
];

export default function RankingsPage() {
  return (
    <PageShell size="wide" className="space-y-8">
      {/* Header */}
      <div>
        <p className="section-kicker">Live quote data · Yahoo Finance</p>
        <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Rankings</h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500">
          Choose a category to load the top 10 stocks with live data. No fake prices.
        </p>
      </div>

      {/* Category grid */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rankingCards.map((card) => (
          <Link
            key={card.slug}
            href={`/rankings/${card.slug}`}
            className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.14] hover:bg-elevated"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="section-kicker">{card.label}</p>
            </div>
            <h2 className="mt-2 text-base font-semibold text-white">{card.title}</h2>
            <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{card.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              View Top 10 →
            </span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
