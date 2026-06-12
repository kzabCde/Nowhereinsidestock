"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { useSearchStore } from "@/store/search-store";

const desktopNav = [
  { href: "/rankings", label: "Rankings" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/compare", label: "Compare" }
];

const mobileNav = [
  { href: "/", label: "Home" },
  ...desktopNav,
  { href: "/disclaimer", label: "Disclaimer" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openSearch = useSearchStore((s) => s.open);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050507]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <NowhereInsideStockLogo compact className="max-w-[72vw] shrink-0" />

        <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
          {desktopNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-accent/30 bg-accent/10 text-accent"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Open search"
            className="hidden h-9 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-3 text-sm text-slate-400 transition hover:border-white/25 hover:text-slate-200 md:flex"
          >
            <Search size={15} />
            <span>Search</span>
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600">⌘K</kbd>
          </button>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] text-white md:hidden"
          >
            <span className="relative h-4 w-5">
              <span className={`absolute left-0 top-0 h-px w-5 bg-current transition ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-2 h-px w-5 bg-current transition ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-4 h-px w-5 bg-current transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-navigation" className="border-t border-white/10 px-4 pb-4 md:hidden">
          <nav aria-label="Mobile" className="mx-auto grid w-full max-w-7xl gap-2 pt-3">
            {mobileNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "border-accent/25 bg-accent/10 text-accent"
                      : "border-white/10 bg-white/[0.035] text-slate-200 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
