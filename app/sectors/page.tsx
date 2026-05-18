import Link from "next/link";

const sectors = [
  ["technology", "Technology"],
  ["communication-services", "Communication Services"],
  ["consumer-cyclical", "Consumer Cyclical"],
  ["consumer-defensive", "Consumer Defensive"],
  ["financial-services", "Financial Services"],
  ["healthcare", "Healthcare"],
  ["industrials", "Industrials"],
  ["energy", "Energy"],
  ["utilities", "Utilities"],
  ["real-estate", "Real Estate"],
  ["basic-materials", "Basic Materials"]
] as const;

export default function SectorsPage() {
  return <main className="grid-overlay min-h-screen px-4 py-6 sm:px-6"><div className="mx-auto max-w-7xl"><h1 className="mb-4 text-3xl font-bold">Business Sectors</h1><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sectors.map(([id, label]) => <Link key={id} href={`/sectors/${id}`} className="printstream-shell pearl-border rounded-2xl p-4"><h2 className="text-lg font-semibold">{label}</h2></Link>)}</div></div></main>;
}
