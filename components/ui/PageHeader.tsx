import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  compact?: boolean;
};

export function PageHeader({ eyebrow, title, description, actions, meta, compact = false }: PageHeaderProps) {
  return (
    <section className={`page-intro ${compact ? "px-5 py-5 sm:px-6 sm:py-6" : ""}`}>
      <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="signal-dot" aria-hidden="true" />
            <p className="section-kicker">{eyebrow}</p>
            {meta ? <div className="text-xs text-slate-500">{meta}</div> : null}
          </div>
          <h1 className={`${compact ? "mt-2.5 text-2xl sm:text-3xl" : "mt-3 text-3xl sm:text-4xl"} font-semibold tracking-[-0.035em] text-white`}>
            {title}
          </h1>
          {description ? <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px] sm:leading-7">{description}</p> : null}
        </div>
        {actions ? <div className="relative z-[1] flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
