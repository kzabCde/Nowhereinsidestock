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
      ? "border-accent/60 bg-accent text-white hover:bg-[#63b6ff]"
      : tone === "danger"
        ? "border-danger/25 bg-danger/10 text-danger hover:bg-danger/15 hover:border-danger/40"
        : "border-white/[0.1] bg-white/[0.04] text-slate-200 hover:border-white/[0.18] hover:bg-white/[0.08] hover:text-white";
  return `inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-40 ${toneClass} ${className}`;
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
