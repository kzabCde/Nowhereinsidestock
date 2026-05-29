import Link from "next/link";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";

export default function FairValueToolPage() {
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Link href="/" className="btn-premium inline-flex">← Back to Dashboard</Link>
        <FairValueCalculator />
      </div>
    </main>
  );
}
