import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  className?: string;
  tone?: "primary" | "neutral" | "danger";
};

type PremiumButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type PremiumLinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

function classes(tone: CommonProps["tone"] = "neutral", className = "") {
  const toneClass =
    tone === "primary"
      ? "border-cyan-200/40 bg-cyan-200/10 text-cyan-50 hover:border-cyan-100/60 hover:bg-cyan-200/15"
      : tone === "danger"
        ? "border-rose-300/35 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15"
        : "border-white/15 bg-white/[0.04] text-slate-100 hover:border-white/25 hover:bg-white/[0.08]";
  return `inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-200/40 disabled:cursor-not-allowed disabled:opacity-45 ${toneClass} ${className}`;
}

export function PremiumButton(props: PremiumButtonProps | PremiumLinkProps) {
  const { children, className, tone, ...rest } = props;
  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest;
    return (
      <Link href={href} className={classes(tone, className)} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes(tone, className)} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
