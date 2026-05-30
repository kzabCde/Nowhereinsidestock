import { PageShell } from "@/components/ui/PageShell";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SectionCard } from "@/components/ui/SectionCard";

const rankingCards = [
  { slug: "top-gainers", title: "Top Gainers", description: "Best percentage gainers from curated liquid US stocks." },
  { slug: "top-losers", title: "Top Losers", description: "Largest percentage decliners from curated liquid US stocks." },
  { slug: "most-active", title: "Most Active", description: "Stocks with the highest trading activity right now." },
  { slug: "highest-market-cap", title: "Highest Market Cap", description: "Largest companies ranked by market capitalization." },
  { slug: "highest-volume", title: "Highest Volume", description: "Biggest raw trading volume in current session." },
  { slug: "strongest-momentum", title: "Strongest Momentum", description: "Blend of change percent and trading volume score." },
  { slug: "lowest-volatility", title: "Lowest Volatility", description: "Most stable movers based on low absolute daily change." },
  { slug: "magnificent-seven", title: "Magnificent Seven", description: "Performance ranking across the Magnificent Seven names." },
  { slug: "thai-stocks", title: "Thai Stocks", description: "Top Thai stock movers from curated SET large caps." },
  { slug: "ai-tech", title: "AI / Tech", description: "Leading AI and technology stocks ranked by performance." }
];

export default function RankingsPage() {
  return (
    <PageShell size="wide" className="space-y-6">
      <SectionCard>
        <p className="section-kicker">Live quote data</p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Top Rankings</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Choose a category to load only the top 10 stocks with Yahoo Finance quote data. No fake prices, no sector clutter.</p>
      </SectionCard>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rankingCards.map((card) => (
          <SectionCard key={card.slug} as="article" className="flex h-full flex-col">
            <p className="section-kicker">Category</p>
            <h2 className="mt-3 text-xl font-semibold text-white">{card.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{card.description}</p>
            <PremiumButton href={`/rankings/${card.slug}`} className="mt-5 w-full sm:w-fit">View Top 10</PremiumButton>
          </SectionCard>
        ))}
      </section>
    </PageShell>
  );
}
