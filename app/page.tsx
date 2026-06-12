import Link from "next/link";
import { BarChart2, GitCompare, Star } from "lucide-react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { SearchTriggerButton } from "@/components/ui/SearchTriggerButton";
import { PageShell } from "@/components/ui/PageShell";

const actions = [
  {
    href: "/rankings",
    icon: BarChart2,
    title: "Rankings",
    description: "Top 10 live leaders by category — gainers, volume, momentum, and more."
  },
  {
    href: "/watchlist",
    icon: Star,
    title: "Watchlist",
    description: "Monitor saved stocks with live quotes in one clean list."
  },
  {
    href: "/compare",
    icon: GitCompare,
    title: "Compare",
    description: "Normalize performance across 2–4 stocks on a shared timeline."
  }
] as const;

const rankingPreview = [
  { href: "/rankings/top-gainers", title: "Top Gainers", label: "Best % change" },
  { href: "/rankings/most-active", title: "Most Active", label: "Highest volume" },
  { href: "/rankings/strongest-momentum", title: "Strongest Momentum", label: "Trend blend" }
];

export default function HomePage() {
  return (
    <PageShell size="wide" className="space-y-12 sm:space-y-16">
      {/* ── Hero ── */}
      <section className="pt-4 text-center sm:pt-8">
        <p className="section-kicker">Stock intelligence platform</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          See the trend.{" "}
          <span className="text-slate-500">Read the signal.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 sm:text-lg">
          Live quotes, technical signals, rankings, watchlists, and normalized stock comparisons.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchTriggerButton placeholder="Search stock symbol, company, or ticker…" />
          <p className="mt-2.5 text-xs text-slate-700">
            Press <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">⌘K</kbd> to search from anywhere
          </p>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="grid gap-3 sm:grid-cols-3">
        {actions.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.14] hover:bg-elevated"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-elevated">
              <Icon size={17} className="text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Open →
            </span>
          </Link>
        ))}
      </section>

      {/* ── Magnificent Seven ── */}
      <section>
        <MagnificentSeven />
      </section>

      {/* ── Rankings preview ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Rankings</p>
            <h2 className="mt-1.5 text-xl font-semibold text-white">Top categories</h2>
          </div>
          <Link
            href="/rankings"
            className="btn-premium text-xs"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {rankingPreview.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-white/[0.08] bg-surface p-4 transition-all hover:border-white/[0.14] hover:bg-elevated"
            >
              <p className="section-kicker">{item.label}</p>
              <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Load top 10 →
              </p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
