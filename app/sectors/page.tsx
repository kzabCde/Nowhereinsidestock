import { SectorGrid } from "@/components/sectors/SectorGrid";
import { BUSINESS_SECTORS } from "@/lib/constants/sectors";

export default function SectorsPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
          <h1 className="text-2xl font-bold sm:text-3xl">Business Sectors</h1>
          <p className="text-sm text-slate-300 sm:text-base">Explore stocks by industry and business type.</p>
        </section>
        <SectorGrid sectors={BUSINESS_SECTORS} />
      </div>
    </main>
  );
}
