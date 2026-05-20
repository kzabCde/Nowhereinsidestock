import Link from "next/link";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";

const nav = [
  { href: "/rankings", label: "🏆 Rankings" },
  { href: "/watchlist", label: "⭐ Watchlist" },
  { href: "/compare", label: "📊 Compare" }
];

export function AppHeader() {
  return (
    <header className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
      <div className="printstream-shell pearl-border rounded-3xl p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <NowhereInsideStockLogo compact className="justify-start" />
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="btn-premium w-full text-center sm:w-auto">{item.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
