"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const legalLinks: Array<{ href: string; label?: MessageKey; text?: string; external?: boolean }> = [
  { href: "/privacy", label: "nav.privacy" },
  { href: "/terms", label: "nav.terms" },
  { href: "/disclaimer", label: "nav.disclaimer" },
  { href: "https://github.com", text: "GitHub", external: true }
];

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-bg px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          © 2026{" "}
          <a
            href="https://nowheredev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-400 transition-colors hover:text-white"
          >
            NOWHEREDEV
          </a>
        </p>

        <nav className="flex flex-wrap gap-4 text-xs text-slate-600">
          {legalLinks.map((link) => {
            const label = link.label ? t(link.label) : link.text;
            return link.external ? (
              <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-300">
                {label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-slate-300">
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-7xl text-xs text-slate-700">{t("footer.marketDisclaimer")}</p>
    </footer>
  );
}
