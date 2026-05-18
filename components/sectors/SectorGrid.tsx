import type { BusinessSector } from "@/lib/constants/sectors";
import { SectorCard } from "@/components/sectors/SectorCard";

export function SectorGrid({ sectors }: { sectors: BusinessSector[] }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{sectors.map((sector) => <SectorCard key={sector.id} sector={sector} />)}</div>;
}
