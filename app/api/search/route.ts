import { NextResponse } from "next/server";
import { searchSymbols } from "@/lib/services/market";
import type { SearchItem } from "@/lib/types/market";

const SEARCH_CACHE_TTL_MS = 30_000;
const SEARCH_CACHE_MAX_ENTRIES = 100;

type SearchApiResponse = {
  results: {
    symbol: string;
    name?: string;
    exchange?: string;
    type?: string;
  }[];
};

type CacheEntry = {
  expiresAt: number;
  results: SearchApiResponse["results"];
};

const searchCache = new Map<string, CacheEntry>();

function toSearchResult(item: SearchItem): SearchApiResponse["results"][number] {
  return {
    symbol: item.symbol,
    name: item.name ?? item.shortname,
    exchange: item.exchange ?? item.exchDisp,
    type: item.type ?? item.quoteType
  };
}

function json(
  results: SearchApiResponse["results"],
  options: { status?: number; cache?: "short" | "none" } = { cache: "short" }
) {
  return NextResponse.json<SearchApiResponse>(
    { results },
    {
      status: options.status,
      headers: {
        "Cache-Control": options.cache === "none" ? "no-store" : "public, s-maxage=30, stale-while-revalidate=30"
      }
    }
  );
}

function setCache(query: string, results: SearchApiResponse["results"]) {
  if (searchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }

  searchCache.set(query, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    results
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return json([], { cache: "none" });

  const normalizedQuery = q.toUpperCase();
  const cached = searchCache.get(normalizedQuery);

  if (cached && cached.expiresAt > Date.now()) {
    return json(cached.results);
  }

  try {
    const results = (await searchSymbols(normalizedQuery)).map(toSearchResult);
    setCache(normalizedQuery, results);
    return json(results);
  } catch (error) {
    console.error("Yahoo Finance search failed", error);
    return json([], { status: 502, cache: "none" });
  }
}
