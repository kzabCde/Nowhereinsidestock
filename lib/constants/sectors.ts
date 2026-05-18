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
  { id: "technology-ai", name: "Technology / AI", description: "AI, platforms, and enterprise technology leaders.", stocks: [
    { symbol: "AAPL", name: "Apple" }, { symbol: "MSFT", name: "Microsoft" }, { symbol: "NVDA", name: "NVIDIA" }, { symbol: "GOOGL", name: "Alphabet" }, { symbol: "META", name: "Meta" }, { symbol: "AMD", name: "AMD" }, { symbol: "ORCL", name: "Oracle" }, { symbol: "CRM", name: "Salesforce" }, { symbol: "IBM", name: "IBM" }, { symbol: "PLTR", name: "Palantir" }, { symbol: "AVGO", name: "Broadcom" }, { symbol: "ARM", name: "Arm" }
  ] },
  { id: "electric-vehicles", name: "Electric Vehicles", description: "EV makers and mobility transition companies.", stocks: [
    { symbol: "TSLA", name: "Tesla" }, { symbol: "RIVN", name: "Rivian" }, { symbol: "NIO", name: "NIO" }, { symbol: "LI", name: "Li Auto" }, { symbol: "XPEV", name: "XPeng" }, { symbol: "BYDDY", name: "BYD" }, { symbol: "LCID", name: "Lucid" }, { symbol: "GM", name: "General Motors" }, { symbol: "F", name: "Ford" }
  ] },
  { id: "energy", name: "Energy", description: "Global and Thai energy producers and refiners.", stocks: [
    { symbol: "XOM", name: "Exxon Mobil" }, { symbol: "CVX", name: "Chevron" }, { symbol: "COP", name: "ConocoPhillips" }, { symbol: "SLB", name: "SLB" }, { symbol: "PTT.BK", name: "PTT" }, { symbol: "PTTEP.BK", name: "PTTEP" }, { symbol: "TOP.BK", name: "Thai Oil" }, { symbol: "BCP.BK", name: "Bangchak" }
  ] },
  { id: "banking-finance", name: "Banking / Finance", description: "Banks, card networks, and diversified financials.", stocks: [
    { symbol: "JPM", name: "JPMorgan Chase" }, { symbol: "BAC", name: "Bank of America" }, { symbol: "GS", name: "Goldman Sachs" }, { symbol: "MS", name: "Morgan Stanley" }, { symbol: "V", name: "Visa" }, { symbol: "MA", name: "Mastercard" }, { symbol: "KBANK.BK", name: "Kasikornbank" }, { symbol: "SCB.BK", name: "SCB X" }, { symbol: "BBL.BK", name: "Bangkok Bank" }
  ] },
  { id: "consumer-retail", name: "Consumer / Retail", description: "Consumer demand and modern retail operators.", stocks: [
    { symbol: "AMZN", name: "Amazon" }, { symbol: "WMT", name: "Walmart" }, { symbol: "COST", name: "Costco" }, { symbol: "MCD", name: "McDonald's" }, { symbol: "SBUX", name: "Starbucks" }, { symbol: "CPALL.BK", name: "CP ALL" }, { symbol: "CRC.BK", name: "Central Retail" }
  ] },
  { id: "healthcare", name: "Healthcare", description: "Pharma and healthcare services with defensive demand.", stocks: [
    { symbol: "JNJ", name: "Johnson & Johnson" }, { symbol: "PFE", name: "Pfizer" }, { symbol: "UNH", name: "UnitedHealth" }, { symbol: "MRK", name: "Merck" }, { symbol: "ABBV", name: "AbbVie" }, { symbol: "LLY", name: "Eli Lilly" }, { symbol: "NVO", name: "Novo Nordisk" }
  ] },
  { id: "aviation-tourism", name: "Aviation / Tourism", description: "Airlines, airports, and travel ecosystems.", stocks: [
    { symbol: "AOT.BK", name: "Airports of Thailand" }, { symbol: "BA.BK", name: "Bangkok Airways" }, { symbol: "AAV.BK", name: "Asia Aviation" }, { symbol: "DAL", name: "Delta Air Lines" }, { symbol: "UAL", name: "United Airlines" }, { symbol: "LUV", name: "Southwest" }, { symbol: "MAR", name: "Marriott" }, { symbol: "HLT", name: "Hilton" }
  ] },
  { id: "semiconductor", name: "Semiconductor", description: "Semiconductor design, foundry, and equipment names.", stocks: [
    { symbol: "NVDA", name: "NVIDIA" }, { symbol: "AMD", name: "AMD" }, { symbol: "TSM", name: "TSMC" }, { symbol: "INTC", name: "Intel" }, { symbol: "ASML", name: "ASML" }, { symbol: "AVGO", name: "Broadcom" }
  ] },
  { id: "cloud-software", name: "Cloud / Software", description: "Cloud infrastructure and SaaS leaders.", stocks: [
    { symbol: "MSFT", name: "Microsoft" }, { symbol: "AMZN", name: "Amazon" }, { symbol: "GOOGL", name: "Alphabet" }, { symbol: "CRM", name: "Salesforce" }, { symbol: "NOW", name: "ServiceNow" }, { symbol: "SNOW", name: "Snowflake" }
  ] },
  { id: "thai-blue-chips", name: "Thai Blue Chips", description: "Large-cap Thai market leaders.", stocks: [
    { symbol: "PTT.BK", name: "PTT" }, { symbol: "AOT.BK", name: "Airports of Thailand" }, { symbol: "CPALL.BK", name: "CP ALL" }, { symbol: "KBANK.BK", name: "Kasikornbank" }, { symbol: "SCB.BK", name: "SCB X" }, { symbol: "BBL.BK", name: "Bangkok Bank" }
  ] }
];

export const getSectorById = (id: string) => BUSINESS_SECTORS.find((sector) => sector.id === id);
