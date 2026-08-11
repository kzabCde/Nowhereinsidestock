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
  const toneClass = tone === "primary" ? "btn-primary" : tone === "danger" ? "btn-premium border-danger/20 bg-danger/[0.07] text-danger hover:border-danger/35 hover:bg-danger/10" : "btn-premium";
  return `${toneClass} ${className}`;
}

export function PremiumButton(props: PremiumButtonProps | PremiumLinkProps) {
  const { children, className, tone, ...rest } = props;
  if ("href" in rest && rest.href) {
    const { href, ...anchorProps } = rest;
    return <Link href={href} className={classes(tone, className)} {...anchorProps}>{children}</Link>;
  }

  return <button className={classes(tone, className)} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}
