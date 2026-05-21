"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";

const primaryNav = [
  { href: "/rankings", label: "Rankings" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/compare", label: "Compare" }
] as const;

const exploreNav = [
  { href: "/#magnificent-seven", label: "Magnificent Seven" },
  { href: "/rankings/thai-stocks", label: "Thai Stocks" },
  { href: "/rankings/ai-tech", label: "AI / Tech" },
  { href: "/rankings/top-gainers", label: "Top Gainers" }
] as const;

const mobileNav = [
  { href: "/", label: "Home" },
  ...primaryNav,
  { href: "/disclaimer", label: "Disclaimer" }
] as const;

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <NowhereInsideStockLogo compact className="shrink min-w-0" />

        <nav className="hidden items-center gap-2 md:flex">
          {primaryNav.map((item) => (
            <Link key={item.href} href={item.href} className={`btn-premium ${pathname?.startsWith(item.href) ? "bg-white/15" : ""}`}>
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <button onClick={() => setExploreOpen((v) => !v)} className="btn-premium inline-flex items-center gap-1">
              Explore
              <ChevronDownIcon />
            </button>
            {exploreOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-black/95 p-2">
                {exploreNav.map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10" onClick={() => setExploreOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button aria-label="Open menu" className="btn-premium p-2 md:hidden" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {mobileNav.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2" onClick={() => setMobileOpen(false)}>
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

function MenuIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>; }
function ChevronDownIcon() { return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>; }
