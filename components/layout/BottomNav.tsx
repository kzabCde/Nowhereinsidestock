"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, GitCompare, Home, Search, Star } from "lucide-react";
import { useSearchStore } from "@/store/search-store";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/rankings", label: "Rankings", icon: BarChart2 },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/compare", label: "Compare", icon: GitCompare }
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const openSearch = useSearchStore((s) => s.open);

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-bg/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] font-medium uppercase tracking-widest transition-colors ${
                active ? "text-accent" : "text-slate-600 hover:text-slate-400"
              }`}
            >
              {active && (
                <span className="absolute inset-x-3 top-0 h-px rounded-b bg-accent" aria-hidden="true" />
              )}
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          className="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] font-medium uppercase tracking-widest text-slate-600 transition-colors hover:text-slate-400"
        >
          <Search size={18} strokeWidth={2} />
          Search
        </button>
      </div>
    </nav>
  );
}
