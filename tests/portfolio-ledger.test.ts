import assert from "node:assert/strict";
import test from "node:test";
import { migratePortfolioState, preparePortfolioImport, readTransaction, replayLedger, serializePortfolio, summarizeLedger } from "../lib/finance/portfolio-ledger.ts";

const trade = (id: string, type: "buy" | "sell", date: string, quantity: number, price: number, fee = 0) =>
  ({ id, type, date, quantity, price, fee, symbol: "AAPL", currency: "USD" });

test("average cost survives additions, partial sale, liquidation and rebuy", () => {
  const history = [
    trade("b1", "buy", "2025-01-01", 10, 10, 2),
    trade("b2", "buy", "2025-01-02", 10, 20, 2),
    trade("s1", "sell", "2025-01-03", 5, 22, 1)
  ];
  const partial = replayLedger(history).positions![0];
  assert.equal(partial.quantity, 15);
  assert.equal(partial.cost, 228);
  assert.equal(partial.realized, 33);
  const sale = trade("s2", "sell", "2025-01-03", 15, 20, 2);
  const closed = replayLedger([...history, sale]).positions![0];
  assert.equal(closed.quantity, 0);
  assert.equal(closed.cost, 0);
  assert.equal(closed.realized, 103);
  const rebought = replayLedger([...history, sale, trade("b3", "buy", "2025-01-03", 2, 40)]).positions![0];
  assert.equal(rebought.quantity, 2);
  assert.equal(rebought.cost, 80);
  assert.equal(rebought.realized, 103);
});

test("replay is chronological, stable on ties, and rejects oversold histories", () => {
  const buy = trade("b1", "buy", "2025-01-01", 1, 10);
  const sale = trade("s1", "sell", "2025-01-02", 1, 20);
  assert.equal(replayLedger([sale, buy]).positions![0].realized, 10);
  assert.equal(replayLedger([{ ...sale, date: buy.date }, buy]).error?.code, "oversold");
  assert.equal(replayLedger([buy, { ...sale, quantity: 2 }]).error?.code, "oversold");
  assert.equal(replayLedger([buy, { ...sale, currency: "THB" }]).error?.code, "oversold");
  assert.throws(() => readTransaction({ ...buy, date: "2025-02-30" }), /invalid_date/);
  assert.throws(() => readTransaction({ ...buy, fee: Infinity }), /invalid_amount/);
});

test("dividends, trade fees and standalone fees contribute once to P&L by currency", () => {
  const usd = trade("b1", "buy", "2025-01-01", 10, 10, 1);
  const thb = { ...usd, id: "b2", symbol: "PTT.BK", currency: "THB" };
  const ledger = replayLedger([
    usd, thb,
    { ...usd, id: "d", type: "dividend", amount: 5 },
    { ...usd, id: "f", symbol: "", type: "fee", amount: 2 }
  ]);
  const summary = summarizeLedger(ledger.positions!, { AAPL: { latestPrice: 12, currency: "USD" } });
  assert.equal(summary.currencies[0].unrealized, 19);
  assert.equal(summary.currencies[0].totalReturn, 22);
  assert.equal(summary.currencies[0].cashFlow, -98);
  assert.equal(summary.currencies[0].fees, 3);
  assert.equal(summary.currencies[1].currency, "THB");
  assert.equal(summary.currencies[1].totalReturn, null);
  assert.equal(summary.holdings[0].allocation, 100);
});

test("legacy buys migrate without dropping rows and JSON import deduplicates by ID", () => {
  const legacy = { id: "legacy-id", symbol: "aapl", currency: "usd", quantity: 3, price: 10, date: "2025-01-01T00:00:00.000Z" };
  const migrated = migratePortfolioState({ transactions: [legacy, null] });
  assert.equal(migrated.transactions.length, 2);
  assert.equal(replayLedger(migrated.transactions).error?.row, 2);
  const rows = migratePortfolioState({ transactions: [legacy] }).transactions;
  const json = serializePortfolio(rows);
  const first = preparePortfolioImport(json, []);
  assert.equal(first.records[0].type, "buy");
  assert.equal(first.records[0].symbol, "AAPL");
  assert.equal(preparePortfolioImport(json, first.records).duplicates, 1);
  assert.throws(() => preparePortfolioImport(serializePortfolio([{ ...first.records[0], price: 20 }]), first.records), /id_conflict/);
  assert.throws(() => preparePortfolioImport(serializePortfolio([trade("s1", "sell", "2025-01-03", 10, 20)]), first.records, true), /oversold/);
});
