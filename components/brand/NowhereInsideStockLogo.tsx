import Link from "next/link";

type NowhereInsideStockLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export default function NowhereInsideStockLogo({ compact = false, href = "/", className = "" }: NowhereInsideStockLogoProps) {
  const textSize = compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-4xl lg:text-6xl";
  const accentSize = compact ? "h-7 w-7" : "h-8 w-8 sm:h-10 sm:w-10";

  return (
    <Link href={href} className={`group inline-flex max-w-full items-center gap-2 sm:gap-3 ${className}`} aria-label="NowhereInsideStock home">
      <span className={`relative inline-flex shrink-0 items-center justify-center ${accentSize}`} aria-hidden="true">
        <span className="absolute inset-0 rotate-45 rounded-[0.2rem] border border-cyan-200/55 bg-white/5 shadow-[0_0_16px_rgba(125,211,252,0.25)]" />
        <span className="relative h-2.5 w-2.5 rotate-45 bg-gradient-to-br from-white via-cyan-100 to-violet-300" />
      </span>

      <span className="relative min-w-0">
        <span
          className={`${textSize} block truncate bg-gradient-to-r from-white via-cyan-100 to-violet-300 bg-clip-text font-black uppercase leading-tight tracking-[0.08em] text-transparent drop-shadow-[0_0_18px_rgba(125,211,252,0.35)]`}
        >
          NowhereInsideStock
        </span>
        <span className="mt-1 block h-[2px] w-full origin-left bg-gradient-to-r from-white/75 via-cyan-300/75 to-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.45)] transition-transform duration-300 group-hover:scale-x-105" />
      </span>
    </Link>
  );
}
