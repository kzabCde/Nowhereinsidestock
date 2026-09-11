const MIN_MARKET_TIME_MS = Date.UTC(1990, 0, 1);

function maxPlausibleMarketTimeMs(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear() + 2, 0, 1);
}

function toTimestampMs(value: string | number | Date | null | undefined): number | null {
  if (value == null) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.abs(value) < 100_000_000_000 ? value * 1000 : value;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isPlausibleMarketTime(timestampMs: number): boolean {
  return timestampMs >= MIN_MARKET_TIME_MS && timestampMs <= maxPlausibleMarketTimeMs();
}

/**
 * Normalizes market timestamps at the API boundary.
 *
 * yahoo-finance2 may expose regularMarketTime as a Date while older call sites
 * expect Unix seconds. Multiplying a Date's millisecond value by 1000 creates a
 * syntactically valid ISO timestamp tens of thousands of years in the future.
 * This helper detects that historical 1000x conversion error and recovers the
 * original timestamp when possible.
 */
export function normalizeMarketTimeIso(
  value: string | number | Date | null | undefined,
  fallback?: string | number | Date | null
): string | undefined {
  const timestampMs = toTimestampMs(value);

  if (timestampMs != null) {
    if (isPlausibleMarketTime(timestampMs)) return new Date(timestampMs).toISOString();

    const recovered = timestampMs / 1000;
    if (isPlausibleMarketTime(recovered)) return new Date(recovered).toISOString();
  }

  const fallbackMs = toTimestampMs(fallback);
  if (fallbackMs != null && isPlausibleMarketTime(fallbackMs)) return new Date(fallbackMs).toISOString();

  return undefined;
}
