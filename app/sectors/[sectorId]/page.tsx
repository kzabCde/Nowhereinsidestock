import { Suspense } from "react";
import { SectorDetailClient } from "./sector-detail-client";

export default function SectorDetailPage() {
  return <Suspense fallback={<main className="min-h-screen px-4 py-6">Loading...</main>}><SectorDetailClient /></Suspense>;
}
