import { motion } from "framer-motion";

type InsightCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

const tones: Record<NonNullable<InsightCardProps["tone"]>, string> = {
  neutral: "text-white",
  positive: "text-success",
  negative: "text-danger"
};

export function InsightCard({ label, value, tone = "neutral" }: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-elevated/75 p-4 shadow-[0_1px_0_rgba(255,255,255,.04)_inset]"
    >
      <span className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-accent/35 to-transparent" aria-hidden="true" />
      <p className="section-kicker">{label}</p>
      <p className={`mt-2 truncate text-lg font-semibold tracking-[-0.025em] ${tones[tone]}`}>{value}</p>
    </motion.div>
  );
}
