"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const legalLinks: Array<{ href: string; label?: MessageKey; text?: string; external?: boolean }> = [
  { href: "/privacy", label: "nav.privacy" },
  { href: "/terms", label: "nav.terms" },
  { href: "/disclaimer", label: "nav.disclaimer" },
  { href: "https://github.com/kzabCde/Nowhereinsidestock", text: "GitHub", external: true }
];

export default function Footer() {
  const { locale, t } = useI18n();
  return (
    <footer className="mt-20 border-t border-[#d6b36a]/10 bg-[#080704]/80 px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">NowhereInsideStock</p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
            {locale === "th" ? "พื้นที่วิเคราะห์หุ้นในธีม Midnight Ledger — เน้นข้อมูล หลักฐาน และบริบทก่อนการตัดสินใจ" : "Midnight Ledger stock intelligence — designed around evidence, context, and disciplined analysis."}
          </p>
          <p className="mt-3 text-xs text-[#6f6045]">{t("footer.marketDisclaimer")}</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <nav className="flex flex-wrap gap-4 text-xs text-slate-600">
            {legalLinks.map((link) => {
              const label = link.label ? t(link.label) : link.text;
              return link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-accent">{label}</a>
              ) : (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-accent">{label}</Link>
              );
            })}
          </nav>
          <p className="text-xs text-slate-700">© 2026 <a href="https://nowheredev.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-[#9b855d] transition-colors hover:text-accent">NOWHEREDEV</a></p>
        </div>
      </div>
    </footer>
  );
}
