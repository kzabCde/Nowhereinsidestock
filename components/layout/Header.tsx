"use client";

import Link from "next/link";
import { useState } from "react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050507]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <NowhereInsideStockLogo compact className="max-w-[72vw] shrink-0" />

        <nav aria-label="Primary" className="hidden items-center gap-2 md:flex">
          {desktopNav.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

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

      {open ? (
        <div id="mobile-navigation" className="border-t border-white/10 px-4 pb-4 md:hidden">
          <nav aria-label="Mobile" className="mx-auto grid w-full max-w-7xl gap-2 pt-3">
            {mobileNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.07] hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
