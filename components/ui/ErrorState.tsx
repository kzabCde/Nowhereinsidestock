"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

type ErrorStateProps = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { locale, t } = useI18n();
  return (
    <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
      <p className="section-kicker text-danger/60">{locale === "th" ? "เกิดข้อผิดพลาด" : "Error"}</p>
      <p className="mt-1.5 text-sm leading-6 text-slate-300">{message}</p>
      {onRetry ? <button type="button" onClick={onRetry} className="mt-3 btn-premium text-xs">{t("common.retry")}</button> : null}
    </div>
  );
}
