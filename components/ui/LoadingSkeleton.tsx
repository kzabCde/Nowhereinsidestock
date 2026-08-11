"use client";

import { useI18n } from "@/components/i18n/I18nProvider";

export function LoadingSkeleton({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="data-panel space-y-4 p-5 sm:p-6" role="status">
      <div className="relative z-[1] h-[10px] w-24 animate-pulse rounded-full bg-white/[0.065]" />
      <div className="relative z-[1] h-9 w-1/2 animate-pulse rounded-xl bg-white/[0.055]" />
      <div className="relative z-[1] h-4 w-3/4 animate-pulse rounded-full bg-white/[0.035]" />
      <div className="relative z-[1] mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl border border-white/[0.035] bg-white/[0.035]" />
        <div className="h-24 animate-pulse rounded-xl border border-white/[0.035] bg-white/[0.035]" />
        <div className="h-24 animate-pulse rounded-xl border border-white/[0.035] bg-white/[0.035]" />
      </div>
      <span className="sr-only">{label ?? t("common.loading")}</span>
    </div>
  );
}
