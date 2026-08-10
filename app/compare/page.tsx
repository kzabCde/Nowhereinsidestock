import { Suspense } from "react";
import { CompareBuilder } from "@/components/compare/CompareBuilder";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getServerI18n } from "@/lib/i18n/server";

export default async function Page() {
  const { locale } = await getServerI18n();
  return (
    <Suspense fallback={<LoadingSkeleton label={locale === "th" ? "กำลังโหลดเครื่องมือเปรียบเทียบ" : "Loading compare builder"} />}>
      <CompareBuilder />
    </Suspense>
  );
}
