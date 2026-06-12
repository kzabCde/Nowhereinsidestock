"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { useSearchStore } from "@/store/search-store";

const navLinks = [
  { href: "/rankings", label: "Rankings" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/compare", label: "Compare" }
];

const mobileMenuLinks = [
  { href: "/", label: "Home" },
  ...navLinks,
  { href: "/disclaimer", label: "Disclaimer" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openSearch = useSearchStore((s) => s.open);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <NowhereInsideStockLogo compact className="mr-2 max-w-[56vw] shrink-0" />

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Search button — desktop */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search stocks"
            className="hidden h-8 items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 text-sm text-slate-500 transition-all hover:border-white/[0.16] hover:text-slate-300 md:flex"
          >
            <Search size={14} />
            <span>Search</span>
            <kbd className="ml-1 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600">⌘K</kbd>
          </button>

          {/* Search icon — mobile */}
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search stocks"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-400 transition hover:text-slate-200 md:hidden"
          >
            <Search size={15} />
          </button>

          {/* Hamburger — mobile */}
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-slate-400 transition hover:text-slate-200 md:hidden"
          >
            <span className="relative h-3.5 w-4">
              <span className={`absolute left-0 top-0 h-px w-4 bg-current transition-all ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-all ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3 h-px w-4 bg-current transition-all ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-nav" className="border-t border-white/[0.06] bg-bg/95 md:hidden">
          <nav aria-label="Mobile menu" className="mx-auto max-w-7xl px-4 pb-4 pt-3 sm:px-6">
            <div className="space-y-0.5">
              {mobileMenuLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
