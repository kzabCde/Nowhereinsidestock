import { expect, test } from "@playwright/test";
import { mockMarket } from "./market-fixtures";

test("search opens stock detail, chart views persist, analytics render, and watchlist saves", async ({ page }) => {
  const market = await mockMarket(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recently viewed" })).toBeVisible();
  expect(market.quotes).toBe(0);
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog");
  const search = dialog.getByRole("combobox");
  await expect(search).toBeFocused();
  await search.fill("apple");
  await expect(dialog.getByRole("option", { name: /AAPL/ })).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/stocks\/AAPL$/);
  await expect(page.getByRole("heading", { name: "Apple Inc." })).toBeVisible();
  await page.getByRole("button", { name: "1M timeframe" }).click();
  await expect(page.getByRole("button", { name: "1M timeframe" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "6M timeframe" }).click();
  await page.getByRole("button", { name: "1M timeframe" }).click();
  await expect(page.getByRole("button", { name: "1M timeframe" })).toHaveAttribute("aria-pressed", "true");
  expect(market.chartRequests).toBe(1);

  await page.getByRole("button", { name: "Chart settings" }).click();
  await page.getByRole("button", { name: "Candlestick", exact: true }).click();
  await expect(page.getByRole("button", { name: "Candlestick", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("checkbox", { name: "MA200" }).check();
  await page.getByRole("tab", { name: "Moving Average", exact: true }).click();
  await expect(page.getByRole("heading", { name: "MA200", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Backtest", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Moving-Average Cross Backtest" })).toBeVisible();
  await expect(page.getByText("Out-of-sample", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Add AAPL to watchlist" }).click();
  market.failDetail = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByText(/Showing the last successful snapshot/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Apple Inc." })).toBeVisible();
  await page.goto("/watchlist");
  await expect(page.getByRole("main").getByText("AAPL", { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Recently viewed" }).locator("..").getByRole("link", { name: "AAPL" })).toBeVisible();
});

test("the local ledger migrates buys, supports partial sales, and round-trips JSON", async ({ page }, info) => {
  await mockMarket(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem("nis-portfolio-v1")) localStorage.setItem("nis-portfolio-v1", JSON.stringify({
      version: 0, state: { transactions: [{ id: "old-buy", symbol: "AAPL", currency: "USD", quantity: 2, price: 90, date: "2025-01-01T00:00:00.000Z" }] }
    }));
  });
  await page.goto("/portfolio");
  await expect(page.getByText(/2 shares/)).toBeVisible();
  const add = async (type: "buy" | "sell", symbol: string, quantity: string, price: string, date: string) => {
    await page.getByLabel("Transaction type").selectOption(type);
    await page.getByLabel("Symbol", { exact: true }).fill(symbol);
    await page.getByLabel("Shares", { exact: true }).fill(quantity);
    await page.getByLabel("Price per share").fill(price);
    await page.getByLabel("Transaction date").fill(date);
    await page.getByRole("button", { name: "Save transaction" }).click();
    await expect(page.getByText("Transaction saved.")).toBeVisible();
  };
  await add("buy", "AAPL", "3", "100", "2025-01-02");
  await add("sell", "AAPL", "1", "120", "2025-01-03");
  await expect(page.getByText(/4 shares/)).toBeVisible();
  await expect(page.getByText("$24.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$56.00", { exact: true })).toBeVisible();
  await add("buy", "NONE", "1", "500", "2025-01-04");
  await expect(page.getByText(/1 of 2 positions valued/)).toBeVisible();
  await expect(page.getByText("$56.00", { exact: true })).toBeVisible();

  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const file = info.outputPath("ledger.json");
  await (await downloading).saveAs(file);
  await page.getByLabel("Portfolio JSON file").setInputFiles(file);
  await page.getByRole("button", { name: "Import JSON" }).click();
  await expect(page.getByText(/4 duplicates skipped/)).toBeVisible();
  await page.getByLabel("Portfolio JSON file").setInputFiles(file);
  await page.getByLabel("Replace existing ledger").check();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "Import JSON" }).click();
  await expect(page.getByText(/4 shares/)).toBeVisible();
});

test("alerts establish a baseline, notify after a crossing, and deduplicate repeat checks", async ({ page }) => {
  const market = await mockMarket(page);
  await page.goto("/alerts");
  await page.getByLabel("Ticker").fill("AAPL");
  await page.getByLabel("Target").fill("115");
  await page.getByRole("button", { name: "Create alert" }).click();
  await expect(page.getByText("Waiting", { exact: true })).toBeVisible();
  market.aapl = 120;
  market.minute = 1;
  await page.getByRole("button", { name: "Evaluate alerts" }).click();
  await expect(page.getByText("Condition true")).toBeVisible();
  await expect(page.getByRole("link", { name: "1 new alert" })).toBeVisible();
  await page.getByRole("button", { name: "Evaluate alerts" }).click();
  await expect(page.getByRole("link", { name: "1 new alert" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "In-app notification history" }).locator("..").getByRole("listitem")).toHaveCount(1);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByText("Condition true")).toBeVisible();
  await page.goto("/");
  await expect(page.getByText("1 monitored on this device")).toBeVisible();
});

test("screener persists applied filters and sends selected markets to Compare", async ({ page }) => {
  await mockMarket(page);
  await page.goto("/screener");
  await expect(page.getByText(/2 of 2 candidates match/)).toBeVisible();
  await page.getByLabel("Max price", { exact: true }).fill("120");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText(/1 of 2 candidates match/)).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Max price", { exact: true })).toHaveValue("120");
  await expect(page.getByText(/1 of 2 candidates match/)).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Universe").selectOption("custom");
  await page.getByLabel("Symbols (up to 20)").fill("AAPL, PTT.BK");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText(/User-defined symbols/)).toBeVisible();
  await page.getByRole("checkbox", { name: "Compare AAPL" }).check();
  await page.getByRole("checkbox", { name: "Compare PTT.BK" }).check();
  await page.getByRole("link", { name: "Compare 2 stocks" }).click();
  await page.getByRole("button", { name: "Show Result" }).click();
  await expect(page.getByRole("heading", { name: "Normalized performance" })).toBeVisible();
  await expect(page.getByText("Base 100 on the first shared trading date", { exact: false })).toBeVisible();
  await expect(page.getByText(/^n=/)).toHaveCount(4);
});

test("language changes persist and the search dialog restores focus", async ({ page }) => {
  await mockMarket(page);
  await page.goto("/");
  const trigger = page.getByRole("banner").getByRole("button", { name: "Search stocks" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: /^Language/ }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "th");
  await expect(page.getByRole("heading", { name: "หุ้นที่ดูล่าสุด" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "หุ้นที่ดูล่าสุด" })).toBeVisible();
  await page.getByRole("button", { name: /^ภาษา/ }).click();
  await expect(page.getByRole("heading", { name: "Recently viewed" })).toBeVisible();
});

test("production HTTP routes reject invalid inputs and keep the background worker disabled", async ({ request }) => {
  const invalid = await request.get("/api/quote/AAPL?range=invalid");
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).code).toBe("invalid_parameter");
  const search = await request.get("/api/search");
  expect(await search.json()).toEqual({ results: [] });
  const screener = await request.get("/api/screener?universe=custom&symbols=");
  expect(screener.status()).toBe(400);
  const worker = await request.get("/api/internal/alert-worker");
  expect(worker.status()).toBe(404);
});

test("dashboard defers market requests until the quote charts are opened", async ({ page }) => {
  const market = await mockMarket(page);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(market.quotes).toBe(0);
  await page.getByRole("button", { name: "Show quote charts" }).click();
  await expect.poll(() => market.quotes).toBe(7);
  await expect(page.getByRole("heading", { name: "Apple Inc.", exact: true })).toBeVisible();
});
