import { Suspense } from "react";
import { CompareBuilder } from "@/components/compare/CompareBuilder";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton label="Loading compare builder" />}>
      <CompareBuilder />
    </Suspense>
  );
}
