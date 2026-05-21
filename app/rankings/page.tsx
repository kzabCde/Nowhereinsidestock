"use client";

import Link from "next/link";
import { useState } from "react";

const tabs = [
  { slug: "top-gainers", label: "Top Gainers" },
  { slug: "top-losers", label: "Top Losers" },
  { slug: "most-active", label: "Most Active" },
  { slug: "highest-market-cap", label: "Market Cap" },
  { slug: "highest-volume", label: "Volume" },
  { slug: "strongest-momentum", label: "Momentum" },
  { slug: "lowest-volatility", label: "Low Volatility" },
  { slug: "magnificent-seven", label: "Mag 7" },
  { slug: "thai-stocks", label: "Thai Stocks" },
  { slug: "ai-tech", label: "AI / Tech" }
] as const;

export default function RankingsPage() {
  const [active, setActive] = useState<(typeof tabs)[number]>(tabs[0]);
  return <main className="grid-overlay min-h-screen px-4 py-6 sm:px-6"><div className="mx-auto max-w-7xl space-y-4"><section className="printstream-shell rounded-3xl p-5"><h1 className="text-2xl font-bold">Rankings</h1><div className="mt-4 flex flex-wrap gap-2">{tabs.map((t) => <button key={t.slug} onClick={() => setActive(t)} className={`rounded-full border px-3 py-1 text-xs ${active.slug === t.slug ? "border-white/30 bg-white/10" : "border-white/10 bg-white/5"}`}>{t.label}</button>)}</div><div className="mt-6"><Link href={`/rankings/${active.slug}`} className="btn-premium">View {active.label}</Link></div></section></div></main>;
}
