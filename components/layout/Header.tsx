"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { useSearchStore } from "@/store/search-store";
import type { MessageKey } from "@/lib/i18n/messages";

const navLinks: Array<{ href: string; label: MessageKey }> = [
  { href: "/screener", label: "nav.screener" },
  { href: "/rankings", label: "nav.rankings" },
  { href: "/portfolio", label: "nav.portfolio" },
  { href: "/watchlist", label: "nav.watchlist" },
  { href: "/compare", label: "nav.compare" },
  { href: "/alerts", label: "nav.alerts" }
];

const mobileMenuLinks: Array<{ href: string; label: MessageKey }> = [
  { href: "/", label: "nav.home" },
  ...navLinks,
  { href: "/disclaimer", label: "nav.disclaimer" }
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openSearch = useSearchStore((s) => s.open);
  const { t } = useI18n();

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#d6b36a]/10 bg-[#0a0907]/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#0a0907]/82">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <NowhereInsideStockLogo compact className="mr-1 max-w-[56vw] shrink-0" />

        <nav aria-label={t("nav.primary")} className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${active ? "bg-accent/[0.08] text-[#f1ddad]" : "text-slate-500 hover:bg-[#fff8e7]/[0.035] hover:text-slate-200"}`}
              >
                {t(item.label)}
                {active ? <span className="absolute inset-x-3 -bottom-[7px] h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={openSearch}
            aria-label={t("nav.searchStocks")}
            className="hidden h-8 items-center gap-2 rounded-xl border border-[#d6b36a]/15 bg-[#fff8e7]/[0.025] px-3 text-sm text-slate-500 transition-all hover:border-accent/35 hover:bg-accent/[0.06] hover:text-[#f3e1b8] lg:flex"
          >
            <Search size={14} />
            <span>{t("nav.search")}</span>
            <kbd className="ml-1 rounded border border-[#d6b36a]/10 bg-black/20 px-1.5 py-0.5 text-[10px] text-[#8f7b55]">⌘K</kbd>
          </button>

          <button type="button" onClick={openSearch} aria-label={t("nav.searchStocks")} className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#d6b36a]/15 bg-[#fff8e7]/[0.025] text-slate-500 transition hover:border-accent/35 hover:text-accent lg:hidden">
            <Search size={15} />
          </button>

          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("nav.toggleMenu")}
            onClick={() => setOpen((value) => !value)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#d6b36a]/15 bg-[#fff8e7]/[0.025] text-slate-500 transition hover:border-accent/35 hover:text-accent lg:hidden"
          >
            <span className="relative h-3.5 w-4">
              <span className={`absolute left-0 top-0 h-px w-4 bg-current transition-all ${open ? "translate-y-1.5 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-1.5 h-px w-4 bg-current transition-all ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3 h-px w-4 bg-current transition-all ${open ? "-translate-y-1.5 -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-[#d6b36a]/10 bg-[#0c0b08]/97 shadow-elevated lg:hidden">
          <nav aria-label={t("nav.mobileMenu")} className="mx-auto max-w-7xl px-4 pb-4 pt-3 sm:px-6">
            <div className="grid gap-0.5 sm:grid-cols-2">
              {mobileMenuLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${active ? "bg-accent/[0.08] text-[#f1ddad]" : "text-slate-500 hover:bg-[#fff8e7]/[0.035] hover:text-slate-200"}`}
                  >
                    {t(item.label)}
                    <span className={active ? "text-accent" : "text-[#65583f]"}>→</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
