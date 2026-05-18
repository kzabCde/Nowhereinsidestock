export type SectorStock = {
  symbol: string;
  name: string;
};

export type BusinessSector = {
  id: string;
  name: string;
  description: string;
  stocks: SectorStock[];
};

export const BUSINESS_SECTORS: BusinessSector[] = [
  {
    id: "technology-ai",
    name: "Technology / AI",
    description: "Cloud platforms, chips, software, and AI infrastructure leaders.",
    stocks: [
      { symbol: "NVDA", name: "NVIDIA" },
      { symbol: "MSFT", name: "Microsoft" },
      { symbol: "AAPL", name: "Apple" },
      { symbol: "GOOGL", name: "Alphabet" },
      { symbol: "AMD", name: "AMD" }
    ]
  },
  {
    id: "electric-vehicles",
    name: "Electric Vehicles",
    description: "EV manufacturers and ecosystem players focused on next-gen mobility.",
    stocks: [
      { symbol: "TSLA", name: "Tesla" },
      { symbol: "RIVN", name: "Rivian" },
      { symbol: "NIO", name: "NIO" }
    ]
  },
  {
    id: "energy",
    name: "Energy",
    description: "Integrated energy firms spanning upstream, downstream, and utilities.",
    stocks: [
      { symbol: "XOM", name: "Exxon Mobil" },
      { symbol: "CVX", name: "Chevron" },
      { symbol: "PTT.BK", name: "PTT" }
    ]
  },
  {
    id: "banking-finance",
    name: "Banking / Finance",
    description: "Major banks and financial institutions across US and Thai markets.",
    stocks: [
      { symbol: "JPM", name: "JPMorgan Chase" },
      { symbol: "BAC", name: "Bank of America" },
      { symbol: "KBANK.BK", name: "Kasikornbank" },
      { symbol: "SCB.BK", name: "SCB X" }
    ]
  },
  {
    id: "consumer-retail",
    name: "Consumer / Retail",
    description: "Consumer demand, ecommerce, and omnichannel retail operators.",
    stocks: [
      { symbol: "AMZN", name: "Amazon" },
      { symbol: "WMT", name: "Walmart" },
      { symbol: "CPALL.BK", name: "CP ALL" }
    ]
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Healthcare, pharma, and medical services focused on resilient demand.",
    stocks: [
      { symbol: "JNJ", name: "Johnson & Johnson" },
      { symbol: "PFE", name: "Pfizer" },
      { symbol: "UNH", name: "UnitedHealth" }
    ]
  },
  {
    id: "aviation-tourism",
    name: "Aviation / Tourism",
    description: "Airlines, airports, and travel-linked operators tied to mobility trends.",
    stocks: [
      { symbol: "AOT.BK", name: "Airports of Thailand" },
      { symbol: "BA.BK", name: "Bangkok Airways" },
      { symbol: "DAL", name: "Delta Air Lines" }
    ]
  }
];
