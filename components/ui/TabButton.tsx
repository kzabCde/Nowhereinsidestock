import type { ButtonHTMLAttributes, ReactNode } from "react";

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  eyebrow?: string;
  icon?: ReactNode;
};

export function TabButton({ active = false, eyebrow, icon, children, className = "", ...props }: TabButtonProps) {
  return (
    <button
      className={`group relative inline-flex shrink-0 items-center gap-2.5 overflow-hidden rounded-xl border px-3.5 py-2.5 text-left text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/25 ${
        active
          ? "border-accent/30 bg-accent/[0.11] text-white shadow-[0_1px_0_rgba(255,255,255,.05)_inset]"
          : "border-transparent bg-transparent text-slate-500 hover:border-white/[0.08] hover:bg-white/[0.035] hover:text-slate-200"
      } ${className}`}
      {...props}
    >
      {active ? <span className="absolute inset-x-3 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" /> : null}
      <span className={active ? "text-accent" : "text-slate-500 transition-colors group-hover:text-slate-300"}>{icon}</span>
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-medium leading-5">{children}</span>
        {eyebrow ? <span className="block whitespace-nowrap text-[10px] leading-4 text-slate-500">{eyebrow}</span> : null}
      </span>
    </button>
  );
}
