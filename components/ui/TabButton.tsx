import type { ButtonHTMLAttributes, ReactNode } from "react";

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  eyebrow?: string;
  icon?: ReactNode;
};

export function TabButton({ active = false, eyebrow, icon, children, className = "", ...props }: TabButtonProps) {
  return (
    <button
      className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-200/50 sm:px-4 ${
        active
          ? "border-white/25 bg-white/10 text-white"
          : "border-white/10 bg-white/[0.025] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
      } ${className}`}
      {...props}
    >
      {icon}
      <span className="min-w-0">
        <span className="block whitespace-nowrap font-semibold leading-5">{children}</span>
        {eyebrow ? <span className="block whitespace-nowrap text-[11px] leading-4 text-slate-400">{eyebrow}</span> : null}
      </span>
    </button>
  );
}
