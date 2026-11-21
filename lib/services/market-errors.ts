const errors = {
  invalid_symbol: [400, "Enter a valid stock symbol."],
  invalid_parameter: [400, "Invalid request parameter."],
  symbol_not_found: [404, "The provider did not find this symbol."],
  rate_limited: [429, "The market data provider is rate-limited. Try again later."],
  provider_unavailable: [502, "The market data provider is temporarily unavailable."],
  timeout: [504, "The market data provider did not respond in time."],
  insufficient_history: [422, "There is insufficient historical data for this request."]
} as const;

export type MarketErrorCode = keyof typeof errors;

export class MarketDataError extends Error {
  readonly code: MarketErrorCode;
  readonly status: number;

  constructor(code: MarketErrorCode, message?: string) {
    const [status, fallback] = errors[code];
    super(message ?? fallback);
    this.name = "MarketDataError";
    this.code = code;
    this.status = status;
  }
}

export function normalizeMarketError(error: unknown): MarketDataError {
  if (error instanceof MarketDataError) return error;
  if (error && typeof error === "object") {
    const { name, status, code: upstreamCode, response } = error as { name?: string; status?: number; code?: number; response?: { status?: number } };
    const code = status ?? response?.status ?? upstreamCode;
    if (code === 404) return new MarketDataError("symbol_not_found");
    if (code === 429) return new MarketDataError("rate_limited");
    if (name === "TimeoutError" || name === "AbortError") return new MarketDataError("timeout");
  }
  return new MarketDataError("provider_unavailable");
}

export function normalizeSymbol(value: string): string {
  const symbol = value.trim().toUpperCase();
  if (!/^\^?[A-Z0-9][A-Z0-9.=-]{0,19}$/.test(symbol)) throw new MarketDataError("invalid_symbol");
  return symbol;
}

export function marketErrorResponse(reason: unknown) {
  const error = normalizeMarketError(reason);
  return Response.json({ code: error.code, message: error.message, error: error.message }, {
    status: error.status, headers: { "Cache-Control": "no-store" }
  });
}
