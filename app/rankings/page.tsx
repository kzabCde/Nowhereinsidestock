import Link from "next/link";
import { AppHeader } from "@/components/ui/AppHeader";

const rankingCards = [
  { slug: "top-gainers", title: "Top Gainers", description: "Best percentage gainers from curated liquid US stocks." },
  { slug: "top-losers", title: "Top Losers", description: "Largest percentage decliners from curated liquid US stocks." },
  { slug: "most-active", title: "Most Active", description: "Stocks with the highest trading activity right now." },
  { slug: "highest-market-cap", title: "Highest Market Cap", description: "Largest companies ranked by market capitalization." },
  { slug: "highest-volume", title: "Highest Volume", description: "Biggest raw trading volume in current session." },
  { slug: "strongest-momentum", title: "Strongest Momentum", description: "Blend of change percent and trading volume score." },
  { slug: "lowest-volatility", title: "Lowest Volatility", description: "Most stable movers based on low absolute daily change." },
  { slug: "magnificent-seven", title: "Magnificent Seven Ranking", description: "Performance ranking across the Magnificent Seven names." },
  { slug: "thai-stocks", title: "Thai Stocks Ranking", description: "Top Thai stock movers from curated SET large caps." },
  { slug: "ai-tech", title: "AI / Tech Ranking", description: "Leading AI and technology stocks ranked by performance." }
];

export default function RankingsPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <AppHeader />
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="flex justify-end">
          <Link href="/" className="btn-premium w-full text-center sm:w-auto">Back to Dashboard</Link>
        </div>
        <section className="printstream-shell pearl-border rounded-3xl p-5">
          <h1 className="text-2xl font-bold sm:text-3xl">Top Rankings</h1>
          <p className="mt-1 text-sm text-slate-300">Open a ranking to load only the top 10 stocks with live Yahoo Finance quote data.</p>
        </section>
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rankingCards.map((card) => (
            <article key={card.slug} className="printstream-shell pearl-border rounded-2xl p-4">
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{card.description}</p>
              <Link href={`/rankings/${card.slug}`} className="btn-premium mt-4 inline-flex">View Ranking</Link>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
