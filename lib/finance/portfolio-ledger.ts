import { normalizeSymbol } from "../services/market-errors.ts";
import { valuePortfolio, type Holding, type HoldingQuote } from "./portfolio-valuation.ts";

export type TransactionType = "buy" | "sell" | "dividend" | "fee";
type TransactionBase = { id: string; symbol: string; currency: string; date: string; note?: string };
export type PortfolioTransaction = TransactionBase & (
  | { type: "buy" | "sell"; quantity: number; price: number; fee: number }
  | { type: "dividend" | "fee"; amount: number }
);
export type TransactionInput = Omit<TransactionBase, "id"> & (
  | { type: "buy" | "sell"; quantity: number; price: number; fee: number }
  | { type: "dividend" | "fee"; amount: number }
);

const MAX_RECORDS = 10_000;
export const PORTFOLIO_VERSION = 1;
const types = new Set(["buy", "sell", "dividend", "fee"]);

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function money(value: unknown, allowZero = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value > 1e15 || (allowZero ? value < 0 : value <= 0)) throw Error("invalid_amount");
  return value;
}

export function readTransaction(input: unknown): PortfolioTransaction {
  const row = object(input);
  const { id, date, note } = row;
  if (typeof id !== "string" || !id.trim() || id.length > 128) throw Error("invalid_id");
  if (typeof row.symbol !== "string" || typeof row.currency !== "string") throw Error("invalid_fields");
  const type = row.type;
  if (typeof type !== "string" || !types.has(type)) throw Error("invalid_type");
  const symbol = type === "fee" && !row.symbol.trim() ? "" : normalizeSymbol(row.symbol);
  const currency = row.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw Error("invalid_currency");
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/.test(date)) throw Error("invalid_date");
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date.slice(0, 10)) throw Error("invalid_date");
  if (note != null && (typeof note !== "string" || note.length > 500)) throw Error("invalid_note");
  const base = { id, symbol, currency, date: parsed.toISOString(), ...(typeof note === "string" && note.trim() ? { note: note.trim() } : {}) };
  if (type === "buy" || type === "sell") {
    const quantity = money(row.quantity);
    const price = money(row.price);
    const fee = money(row.fee ?? 0, true);
    money(quantity * price + fee);
    return { ...base, type, quantity, price, fee };
  }
  return { ...base, type: type as "dividend" | "fee", amount: money(row.amount) };
}

// Keep all persisted rows, including any legacy rows needing user correction.
export function migratePortfolioState(persisted: unknown) {
  const state = object(persisted);
  const transactions = Array.isArray(state.transactions) ? state.transactions.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return entry;
    const row = object(entry);
    return row.type == null ? { ...row, type: "buy", fee: 0 } : row;
  }) : [];
  return { transactions };
}

type Position = Holding & { realized: number; dividends: number; standaloneFees: number; tradeFees: number; cashFlow: number };

type LedgerResult =
  | { error: { code: string; row: number; symbol?: string }; records?: never; positions?: never }
  | { records: PortfolioTransaction[]; positions: Position[]; error?: never };

export function replayLedger(records: unknown[]): LedgerResult {
  if (records.length > MAX_RECORDS) return { error: { code: "invalid_file", row: MAX_RECORDS + 1 } };
  const seen = new Set<string>();
  const rows: PortfolioTransaction[] = [];
  for (const [index, input] of records.entries()) {
    try {
      const transaction = readTransaction(input);
      if (seen.has(transaction.id)) throw Error("duplicate_id");
      seen.add(transaction.id);
      rows.push(transaction);
    } catch (reason) {
      return { error: { code: reason instanceof Error ? reason.message : "invalid_fields", row: index + 1 } } as const;
    }
  }
  const positions = new Map<string, Position>();
  // Array order is the tie-breaker for same-time transactions. Import appends new entries.
  const ordered = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  for (const [index, item] of ordered.entries()) {
    const key = `${item.symbol}:${item.currency}`;
    const position = positions.get(key) ?? {
      key, symbol: item.symbol, currency: item.currency, quantity: 0, cost: 0,
      realized: 0, dividends: 0, standaloneFees: 0, tradeFees: 0, cashFlow: 0
    };
    if (item.type === "buy") {
      const acquisition = item.quantity * item.price + item.fee;
      position.quantity += item.quantity;
      position.cost += acquisition;
      position.tradeFees += item.fee;
      position.cashFlow -= acquisition;
    } else if (item.type === "sell") {
      const remaining = position.quantity - item.quantity;
      const tolerance = 4 * Number.EPSILON * Math.max(position.quantity, item.quantity);
      if (position.quantity <= 0 || remaining < -tolerance) return { error: { code: "oversold", row: index + 1, symbol: item.symbol } } as const;
      const released = Math.abs(remaining) <= tolerance ? position.cost : position.cost * (item.quantity / position.quantity);
      const proceeds = item.quantity * item.price - item.fee;
      position.realized += proceeds - released;
      position.cost -= released;
      position.quantity = Math.abs(remaining) <= tolerance ? 0 : remaining;
      position.tradeFees += item.fee;
      position.cashFlow += proceeds;
    } else if (item.type === "dividend") {
      position.dividends += item.amount;
      position.cashFlow += item.amount;
    } else if (item.type === "fee") {
      position.standaloneFees += item.amount;
      position.cashFlow -= item.amount;
    }
    if (Object.values(position).some((value) => typeof value === "number" && !Number.isFinite(value))) {
      return { error: { code: "invalid_amount", row: index + 1 } } as const;
    }
    positions.set(key, position);
  }
  return { records: rows, positions: [...positions.values()] } as const;
}

export function summarizeLedger(positions: Position[], quotes: Readonly<Record<string, HoldingQuote | undefined>>) {
  const valued = valuePortfolio(positions.filter((position) => position.quantity > 0), quotes);
  const totals = new Map(valued.currencies.map((currency) => [currency.currency, {
    ...currency, realized: 0, dividends: 0, fees: 0, standaloneFees: 0, cashFlow: 0
  }]));
  for (const row of positions) {
    const total = totals.get(row.currency) ?? {
      currency: row.currency, cost: 0, comparableCost: 0, comparableMarketValue: 0, valued: 0, excluded: 0, unrealized: 0,
      status: "complete" as const, realized: 0, dividends: 0, fees: 0, standaloneFees: 0, cashFlow: 0
    };
    total.realized += row.realized;
    total.dividends += row.dividends;
    total.fees += row.tradeFees + row.standaloneFees;
    total.standaloneFees += row.standaloneFees;
    total.cashFlow += row.cashFlow;
    totals.set(row.currency, total);
  }
  const currencies = [...totals.values()].map((total) => ({
    ...total,
    totalReturn: total.excluded ? null : total.realized + total.dividends - total.standaloneFees + (total.unrealized ?? 0)
  }));
  const holdings = valued.positions.map((row) => {
    const total = totals.get(row.currency)!;
    return { ...row, allocation: row.marketValue != null && total.comparableMarketValue > 0 ? row.marketValue / total.comparableMarketValue * 100 : null };
  });
  return { holdings, currencies };
}

export function serializePortfolio(records: unknown[]) {
  return JSON.stringify({ version: PORTFOLIO_VERSION, transactions: records }, null, 2);
}

export function preparePortfolioImport(json: string, existing: unknown[], replace = false) {
  if (json.length > 5_000_000) throw Error("invalid_file");
  let input: Record<string, unknown>;
  try { input = object(JSON.parse(json)); } catch { throw Error("invalid_file"); }
  if (input.version !== PORTFOLIO_VERSION || !Array.isArray(input.transactions) || input.transactions.length > MAX_RECORDS) throw Error("invalid_file");

  const current = replace ? [] : existing.map(readTransaction);
  if (new Set(current.map(({ id }) => id)).size !== current.length) throw Error("duplicate_id");
  const unique = new Map(current.map((row) => [row.id, row]));
  let duplicates = 0;
  for (const inputRow of input.transactions) {
    const row = readTransaction(inputRow);
    const previous = unique.get(row.id);
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(row)) throw Error("id_conflict");
      duplicates += 1;
    } else unique.set(row.id, row);
  }
  if (unique.size > MAX_RECORDS) throw Error("invalid_file");
  const validated = replayLedger([...unique.values()]);
  if (validated.error) throw Error(validated.error.code);
  return { records: validated.records, duplicates, added: unique.size - current.length };
}
