import Link from "next/link";
import { FairValueCalculator } from "@/components/stocks/FairValueCalculator";
import { getServerI18n } from "@/lib/i18n/server";

export default async function FairValueToolPage() {
  const { locale } = await getServerI18n();
  return (
    <main className="grid-overlay min-h-screen overflow-x-hidden">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <Link href="/" className="btn-premium inline-flex">← {locale === "th" ? "กลับหน้าหลัก" : "Back to Dashboard"}</Link>
        <FairValueCalculator />
      </div>
    </main>
  );
}
