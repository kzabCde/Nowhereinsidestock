export function LoadingSkeleton({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="space-y-4" role="status">
      <div className="h-[11px] w-20 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="h-8 w-1/2 animate-pulse rounded-xl bg-white/[0.06]" />
      <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.04]" />
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
        <div className="h-24 animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
