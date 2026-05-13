import { motion } from "framer-motion";

type InsightCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

const tones = {
  neutral: "text-slate-200",
  positive: "text-success",
  negative: "text-danger"
};

export function InsightCard({ label, value, tone = "neutral" }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur"
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
    </motion.div>
  );
}
