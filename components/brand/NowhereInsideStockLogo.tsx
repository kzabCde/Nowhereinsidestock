import Link from "next/link";

type NowhereInsideStockLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export default function NowhereInsideStockLogo({
  compact = false,
  href = "/",
  className = "",
}: NowhereInsideStockLogoProps) {
  const textSize = compact
    ? "text-[clamp(1rem,4.8vw,1.45rem)] sm:text-2xl"
    : "text-[clamp(1.15rem,6vw,2rem)] sm:text-3xl lg:text-5xl";

  return (
    <Link
      href={href}
      aria-label="NowhereInsideStock home"
      className={`group relative inline-flex max-w-full min-w-0 items-center px-1 py-0.5 ${className}`}
    >
      <span
        className={`relative z-10 block break-words text-center font-extrabold uppercase leading-tight tracking-[0.08em] text-transparent sm:whitespace-nowrap ${textSize}
          [-webkit-text-stroke:1.25px_rgba(226,232,240,0.9)] [text-stroke:1.25px_rgba(226,232,240,0.9)]
          transition-[color,text-shadow,-webkit-text-stroke-color,filter] duration-[1200ms] ease-out
          group-hover:[-webkit-text-stroke-color:transparent] group-hover:[text-stroke-color:transparent]
          group-hover:bg-gradient-to-r group-hover:from-white group-hover:via-cyan-100 group-hover:to-violet-300 group-hover:bg-clip-text
          group-active:[-webkit-text-stroke-color:transparent] group-active:[text-stroke-color:transparent]
          group-active:bg-gradient-to-r group-active:from-white group-active:via-cyan-100 group-active:to-violet-300 group-active:bg-clip-text
          group-hover:drop-shadow-[0_0_18px_rgba(125,211,252,0.35)] group-active:drop-shadow-[0_0_18px_rgba(125,211,252,0.35)]`}
      >
        NowhereInsideStock
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 bottom-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-white/75 via-cyan-300/75 to-violet-400/80 shadow-[0_0_12px_rgba(139,92,246,0.45)] transition-transform duration-[2500ms] ease-out group-hover:scale-x-100 group-active:scale-x-100"
      />
    </Link>
  );
}
