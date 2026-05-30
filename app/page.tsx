import Link from "next/link";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { RealtimeStockSearch } from "@/components/stocks/RealtimeStockSearch";
import { PageShell } from "@/components/ui/PageShell";
import { SectionCard } from "@/components/ui/SectionCard";
import { PremiumButton } from "@/components/ui/PremiumButton";

const actions = [
  { href: "/rankings", title: "Rankings", description: "Top 10 live leaders by category." },
  { href: "/watchlist", title: "Watchlist", description: "Track favorite stocks in one clean list." },
  { href: "/compare", title: "Compare", description: "Normalize performance across 2–4 stocks." }
];

const rankingPreview = [
  { href: "/rankings/top-gainers", title: "Top Gainers", label: "Live momentum" },
  { href: "/rankings/most-active", title: "Most Active", label: "Volume focus" },
  { href: "/rankings/strongest-momentum", title: "Strongest Momentum", label: "Trend blend" }
];

export default function HomePage() {
  return (
    <PageShell size="wide" className="space-y-8 sm:space-y-12">
      <section className="py-2 sm:py-6 lg:py-8">
        <SectionCard className="px-4 py-8 text-center sm:px-8 sm:py-12 lg:px-12 lg:py-16">
          
          {/* Search Bar Top */}
          <div className="mx-auto mb-8 w-full max-w-2xl">
            <RealtimeStockSearch placeholder="Search stock symbol, company, or ticker..." />
          </div>

          {/* Logo */}
          <div className="mx-auto flex max-w-full justify-center">
            <NowhereInsideStockLogo className="justify-center" />
          </div>

          {/* Tagline */}
          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-7 text-slate-300 sm:text-lg">
            A minimal signal dashboard for live quotes, technical context, rankings, watchlists, and normalized stock comparisons.
          </p>
        </SectionCard>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="premium-card group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
          >
            <p className="section-kicker">Open</p>
            <h2 className="mt-3 text-xl font-semibold text-white">
              {action.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {action.description}
            </p>
            <span className="mt-5 inline-flex text-sm font-semibold text-cyan-100 transition group-hover:text-white">
              View →
            </span>
          </Link>
        ))}
      </section>

      <section id="magnificent-seven" className="py-2">
        <MagnificentSeven />
      </section>

      <SectionCard className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Top Rankings
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Open a category to load only the top 10 using live Yahoo Finance quote data.
            </p>
          </div>

          <PremiumButton href="/rankings" className="w-full sm:w-auto">
            All rankings
          </PremiumButton>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {rankingPreview.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-cyan-200/30 hover:bg-white/[0.045]"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                {item.label}
              </p>

              <h3 className="mt-3 text-lg font-semibold text-white">
                {item.title}
              </h3>

              <p className="mt-4 text-sm font-medium text-cyan-100">
                Load top 10 →
              </p>
            </Link>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}
