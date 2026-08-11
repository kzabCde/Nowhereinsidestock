"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

type ErrorStateProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { locale, t } = useI18n();
  return (
    <div className="relative overflow-hidden rounded-2xl border border-danger/20 bg-danger/[0.055] p-5 shadow-[0_1px_0_rgba(255,255,255,.035)_inset]">
      <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-danger/70 to-transparent" aria-hidden="true" />
      <p className="section-kicker text-danger/70">{locale === "th" ? "เกิดข้อผิดพลาด" : "Error"}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{message}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="btn-premium mt-4 text-xs">{t("common.retry")}</button> : null}
    </div>
  );
}
