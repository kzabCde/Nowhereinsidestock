import Link from "next/link";

const tabs = [
  { slug: "top-gainers", title: "Top Gainers" },
  { slug: "top-losers", title: "Top Losers" },
  { slug: "most-active", title: "Most Active" },
  { slug: "highest-market-cap", title: "Market Cap" },
  { slug: "strongest-momentum", title: "Momentum" },
  { slug: "thai-stocks", title: "Thai Stocks" },
  { slug: "ai-tech", title: "AI / Tech" }
];

export default function RankingsPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="printstream-shell pearl-border rounded-3xl p-5">
          <h1 className="text-2xl font-bold sm:text-3xl">Top Rankings</h1>
          <p className="mt-1 text-sm text-slate-300">Switch categories using segmented tabs.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link key={tab.slug} href={`/rankings/${tab.slug}`} className="rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
                {tab.title}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
