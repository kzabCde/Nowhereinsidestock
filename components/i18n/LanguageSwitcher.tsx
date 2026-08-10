"use client";

import { Languages } from "lucide-react";
import { useI18n } from "./I18nProvider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === "en" ? "th" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      aria-label={`${t("language.label")}: ${nextLocale === "th" ? t("language.thai") : t("language.english")}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/[0.1] bg-white/[0.04] px-2.5 text-xs font-semibold text-slate-300 transition hover:border-white/[0.18] hover:text-white"
    >
      <Languages size={14} />
      <span>{locale === "en" ? "EN" : "TH"}</span>
      {!compact ? <span className="text-slate-600">/</span> : null}
      {!compact ? <span className="text-slate-500">{locale === "en" ? "TH" : "EN"}</span> : null}
    </button>
  );
}
