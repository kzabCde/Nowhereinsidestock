"use client";

import Link from "next/link";
import { useState } from "react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { MobileMenu } from "@/components/layout/MobileMenu";

type NavItem = { label: string; href: string };
type NavGroup = { label: string; items: NavItem[] };

const mainLinks: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Rankings", href: "/rankings" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Compare", href: "/compare" }
];

const dropdowns: NavGroup[] = [
  {
    label: "Markets",
    items: [
      { label: "Magnificent Seven", href: "/#magnificent-seven" },
      { label: "Top Rankings", href: "/rankings" },
      { label: "Thai Stocks", href: "/rankings/thai-stocks" },
      { label: "AI / Tech", href: "/rankings/ai-tech" }
    ]
  },
  {
    label: "Tools",
    items: [
      { label: "Watchlist", href: "/watchlist" },
      { label: "Compare", href: "/compare" },
      { label: "Search Stock", href: "/" }
    ]
  },
  {
    label: "Info",
    items: [
      { label: "Company Profile", href: "/stocks/AAPL" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" }
    ]
  }
];

const mobileItems: NavItem[] = [
  ...mainLinks,
  { label: "Magnificent Seven", href: "/#magnificent-seven" },
  { label: "Disclaimer", href: "/disclaimer" }
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0">
            <NowhereInsideStockLogo className="w-auto justify-start" />
          </Link>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm md:hidden"
            aria-label="Open main menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span className="block h-3 w-4">
              <span className="mb-1 block h-0.5 w-4 bg-white" />
              <span className="mb-1 block h-0.5 w-4 bg-white" />
              <span className="block h-0.5 w-4 bg-white" />
            </span>
          </button>

          <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                {link.label}
              </Link>
            ))}
            {dropdowns.map((group) => (
              <div key={group.label} className="group relative">
                <button className="rounded-lg px-3 py-2 text-sm hover:bg-white/10" type="button">
                  {group.label} <span aria-hidden>▾</span>
                </button>
                <div className="pointer-events-none absolute right-0 top-full mt-2 w-52 translate-y-1 rounded-xl border border-white/15 bg-[#0a0a0c] p-2 opacity-0 shadow-2xl transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  {group.items.map((item) => (
                    <Link key={item.href + item.label} href={item.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/10">
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
        <MobileMenu open={open} onClose={() => setOpen(false)} items={mobileItems} />
      </div>
    </header>
  );
}
