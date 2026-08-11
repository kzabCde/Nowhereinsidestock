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
          [-webkit-text-stroke:1.2px_rgba(232,221,195,0.88)] [text-stroke:1.2px_rgba(232,221,195,0.88)]
          transition-[color,text-shadow,-webkit-text-stroke-color,filter] duration-700 ease-out
          group-hover:[-webkit-text-stroke-color:transparent] group-hover:[text-stroke-color:transparent]
          group-hover:bg-gradient-to-r group-hover:from-[#fff8e7] group-hover:via-[#e2c47f] group-hover:to-[#b9853d] group-hover:bg-clip-text
          group-active:[-webkit-text-stroke-color:transparent] group-active:[text-stroke-color:transparent]
          group-active:bg-gradient-to-r group-active:from-[#fff8e7] group-active:via-[#e2c47f] group-active:to-[#b9853d] group-active:bg-clip-text
          group-hover:drop-shadow-[0_0_16px_rgba(214,179,106,0.24)]`}
      >
        NowhereInsideStock
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-[#d6b36a] to-transparent shadow-[0_0_10px_rgba(214,179,106,0.34)] transition-transform duration-500 ease-out group-hover:scale-x-100 group-active:scale-x-100"
      />
    </Link>
  );
}
