import { SectionCard } from "@/components/ui/SectionCard";

export function ErrorState({ message }: { message: string }) {
  return (
    <SectionCard variant="danger" className="text-rose-100">
      <p className="text-xs uppercase tracking-[0.3em] text-rose-200/75">Unable to load</p>
      <p className="mt-2 text-sm leading-6">{message}</p>
    </SectionCard>
  );
}
