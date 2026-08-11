"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const productLinks: Array<{ href: string; label: MessageKey }> = [
  { href: "/screener", label: "nav.screener" },
  { href: "/rankings", label: "nav.rankings" },
  { href: "/compare", label: "nav.compare" },
  { href: "/portfolio", label: "nav.portfolio" }
];

const legalLinks: Array<{ href: string; label?: MessageKey; text?: string; external?: boolean }> = [
  { href: "/privacy", label: "nav.privacy" },
  { href: "/terms", label: "nav.terms" },
  { href: "/disclaimer", label: "nav.disclaimer" },
  { href: "https://github.com/kzabCde/Nowhereinsidestock", text: "GitHub", external: true }
];

export default function Footer() {
  const { locale, t } = useI18n();
  return (
    <footer className="mt-20 border-t border-white/[0.055] bg-[#050812]/75 px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-md">
          <div className="flex items-center gap-2"><span className="signal-dot" aria-hidden="true" /><p className="section-kicker">NowhereInsideStock</p></div>
          <p className="mt-3 text-base font-medium text-slate-200">{locale === "th" ? "พื้นที่วิเคราะห์หุ้นที่อธิบายเหตุผลของข้อมูลได้" : "An explainable workspace for stock intelligence."}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("footer.marketDisclaimer")}</p>
        </div>

        <div>
          <p className="section-kicker">{locale === "th" ? "ผลิตภัณฑ์" : "Product"}</p>
          <nav className="mt-3 grid gap-2 text-sm text-slate-500">
            {productLinks.map((link) => <Link key={link.href} href={link.href} className="w-fit transition-colors hover:text-white">{t(link.label)}</Link>)}
          </nav>
        </div>

        <div>
          <p className="section-kicker">{locale === "th" ? "ข้อมูลและข้อกำหนด" : "Resources"}</p>
          <nav className="mt-3 grid gap-2 text-sm text-slate-500">
            {legalLinks.map((link) => {
              const label = link.label ? t(link.label) : link.text;
              return link.external ? (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="w-fit transition-colors hover:text-white">{label}</a>
              ) : (
                <Link key={link.href} href={link.href} className="w-fit transition-colors hover:text-white">{label}</Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto mt-9 flex w-full max-w-7xl flex-col gap-2 border-t border-white/[0.055] pt-5 text-xs text-slate-700 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 <a href="https://nowheredev.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-slate-500 transition-colors hover:text-white">NOWHEREDEV</a></p>
        <p>{locale === "th" ? "ออกแบบเพื่อการวิเคราะห์และการเรียนรู้ ไม่ใช่คำแนะนำการลงทุน" : "Designed for analysis and learning — not investment advice."}</p>
      </div>
    </footer>
  );
}
