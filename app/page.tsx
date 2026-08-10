import Link from "next/link";
import { Activity, BarChart2, GitCompare, LayoutDashboard, Radar, Star } from "lucide-react";
import { MagnificentSeven } from "@/components/stocks/MagnificentSeven";
import { PageShell } from "@/components/ui/PageShell";
import { SearchTriggerButton } from "@/components/ui/SearchTriggerButton";

const actions = [
  {
    href: "/screener",
    icon: Radar,
    title: "Screener",
    description: "Filter live market-screened or clearly labeled curated stock universes."
  },
  {
    href: "/rankings",
    icon: BarChart2,
    title: "Rankings",
    description: "Market-wide Yahoo predefined screeners where available, with transparent scope labels."
  },
  {
    href: "/portfolio",
    icon: LayoutDashboard,
    title: "Portfolio",
    description: "Track cost, current value, and unrealized P/L without mixing currencies."
  },
  {
    href: "/watchlist",
    icon: Star,
    title: "Watchlist",
    description: "Monitor saved stocks with current quote snapshots in one clean list."
  },
  {
    href: "/compare",
    icon: GitCompare,
    title: "Compare",
    description: "Compare normalized returns, volatility, momentum, drawdown, Sharpe, and Sortino."
  },
  {
    href: "/alerts",
    icon: Activity,
    title: "Alerts",
    description: "Evaluate price, RSI, Golden Cross, and Death Cross conditions on demand."
  }
] as const;

const rankingPreview = [
  { href: "/rankings/top-gainers", title: "Top Gainers", label: "Yahoo market screener" },
  { href: "/rankings/most-active", title: "Most Active", label: "Yahoo market screener" },
  { href: "/rankings/strongest-momentum", title: "Strongest Momentum", label: "Normalized curated analytics" }
];

export default function HomePage() {
  return (
    <PageShell size="wide" className="space-y-12 sm:space-y-16">
      <section className="pt-4 text-center sm:pt-8">
        <p className="section-kicker">Explainable stock intelligence</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          See the trend. <span className="text-slate-500">Read the signal.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
          Near-real-time quote snapshots, tested technical indicators, transparent rankings, valuation tools, portfolio analytics, and explainable signals.
        </p>
        <div className="mx-auto mt-8 max-w-2xl">
          <SearchTriggerButton placeholder="Search stock symbol, company, or ticker…" />
          <p className="mt-2.5 text-xs text-slate-700">
            Press <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-slate-600">⌘K</kbd> to search from anywhere
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-5 transition-all hover:border-white/[0.14] hover:bg-elevated">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-elevated">
              <Icon size={17} className="text-slate-400" />
            </div>
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <p className="mt-1 flex-1 text-sm leading-6 text-slate-500">{description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
          </Link>
        ))}
      </section>

      <section>
        <MagnificentSeven />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Rankings</p>
            <h2 className="mt-1.5 text-xl font-semibold text-white">Transparent market scope</h2>
          </div>
          <Link href="/rankings" className="btn-premium text-xs">View all</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {rankingPreview.map((item) => (
            <Link key={item.href} href={item.href} className="group rounded-2xl border border-white/[0.08] bg-surface p-4 transition-all hover:border-white/[0.14] hover:bg-elevated">
              <p className="section-kicker">{item.label}</p>
              <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">Open ranking →</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
