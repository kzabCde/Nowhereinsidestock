type MetricCardProps = {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
  className?: string;
};

export function MetricCard({ label, value, tone = "neutral", className = "" }: MetricCardProps) {
  const toneClass = tone === "positive" ? "text-emerald-200" : tone === "negative" ? "text-rose-200" : "text-white";
  return (
    <article className={`rounded-2xl border border-white/10 bg-white/[0.035] p-4 ${className}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-lg font-semibold ${toneClass}`}>{value}</p>
    </article>
  );
}
