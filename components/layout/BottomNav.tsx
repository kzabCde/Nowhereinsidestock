"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, GitCompare, Home, Search, Star } from "lucide-react";
import { useSearchStore } from "@/store/search-store";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const navItems: Array<{ href: string; label: MessageKey; icon: typeof Home }> = [
  { href: "/", label: "nav.home", icon: Home },
  { href: "/rankings", label: "nav.rankings", icon: BarChart2 },
  { href: "/watchlist", label: "nav.watchlist", icon: Star },
  { href: "/compare", label: "nav.compare", icon: GitCompare }
];

export function BottomNav() {
  const pathname = usePathname();
  const openSearch = useSearchStore((s) => s.open);
  const { t } = useI18n();

  return (
    <nav
      aria-label={t("nav.mobileBottom")}
      className="fixed inset-x-3 bottom-3 z-30 overflow-hidden rounded-2xl border border-[#d6b36a]/12 bg-[#100e0a]/94 shadow-elevated backdrop-blur-2xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch p-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] transition-all ${active ? "bg-accent/[0.08] text-[#f4e3bd]" : "text-slate-600 hover:bg-[#fff8e7]/[0.025] hover:text-slate-400"}`}
            >
              {active ? <span className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" /> : null}
              <Icon size={17} strokeWidth={active ? 2.3 : 1.9} className={active ? "text-accent" : undefined} />
              {t(label)}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={openSearch}
          aria-label={t("nav.search")}
          className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-600 transition-all hover:bg-[#fff8e7]/[0.025] hover:text-slate-400"
        >
          <Search size={17} strokeWidth={1.9} />
          {t("nav.search")}
        </button>
      </div>
    </nav>
  );
}
