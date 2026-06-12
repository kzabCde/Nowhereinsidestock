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
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#050507]/95 backdrop-blur-xl md:hidden"
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
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] font-semibold uppercase tracking-widest transition ${
                active ? "text-accent" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              {label}
              {active && (
                <span className="absolute top-0 h-px w-8 rounded-b bg-accent" aria-hidden="true" />
              )}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openSearch}
          aria-label="Open search"
          className="flex flex-1 flex-col items-center gap-1 px-2 py-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition hover:text-slate-300"
        >
          <Search size={20} strokeWidth={2} />
          Search
        </button>
      </div>
    </nav>
  );
}
