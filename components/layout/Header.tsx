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
  const { locale, t } = useI18n();

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.055] bg-[#070b16]/82 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#070b16]/74">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-2.5">
          <NowhereInsideStockLogo compact className="max-w-[48vw] shrink-0 sm:max-w-none" />
          <span className="hidden items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 xl:inline-flex">
            <span className="signal-dot" aria-hidden="true" />
            {locale === "th" ? "ระบบวิเคราะห์ตลาด" : "Market intelligence"}
          </span>
        </div>

        <nav aria-label={t("nav.primary")} className="ml-2 hidden items-center rounded-xl border border-white/[0.065] bg-white/[0.018] p-1 lg:flex">
          {navLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-2.5 py-2 text-[12px] font-medium transition-all duration-200 ${active ? "bg-white/[0.055] text-white shadow-[0_1px_0_rgba(255,255,255,.04)_inset]" : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-200"}`}
              >
                {t(item.label)}
                {active ? <span className="absolute inset-x-3 -bottom-1 h-px bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label={t("nav.searchStocks")}
            className="hidden h-9 min-w-44 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 text-sm text-slate-500 transition-all hover:border-accent/25 hover:bg-white/[0.045] hover:text-slate-300 xl:flex"
          >
            <Search size={14} />
            <span className="flex-1 text-left text-xs">{t("nav.search")}</span>
            <kbd className="rounded-md border border-white/[0.08] bg-black/10 px-1.5 py-0.5 text-[9px] text-slate-600">⌘K</kbd>
          </button>
          <LanguageSwitcher compact />
          <button type="button" onClick={openSearch} aria-label={t("nav.searchStocks")} className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-accent/25 hover:text-white xl:hidden">
            <Search size={15} />
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={t("nav.toggleMenu")}
            onClick={() => setOpen((value) => !value)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.025] text-slate-400 transition hover:border-white/[0.14] hover:text-white lg:hidden"
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
        <div id="mobile-nav" className="border-t border-white/[0.055] bg-[#070b16]/96 shadow-elevated lg:hidden">
          <nav aria-label={t("nav.mobileMenu")} className="mx-auto max-w-7xl px-4 pb-5 pt-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="section-kicker">{locale === "th" ? "เมนูหลัก" : "Workspace"}</p>
              <span className="badge-neutral">TH / EN</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {mobileMenuLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-all ${active ? "border-accent/20 bg-accent/[0.08] text-white" : "border-transparent text-slate-400 hover:border-white/[0.07] hover:bg-white/[0.025] hover:text-slate-200"}`}
                  >
                    {t(item.label)}
                    <span className={active ? "text-accent" : "text-slate-700"}>→</span>
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
