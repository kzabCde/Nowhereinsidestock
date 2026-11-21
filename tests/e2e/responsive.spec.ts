import { expect, test } from "@playwright/test";
import { mockMarket } from "./market-fixtures";

for (const width of [320, 393, 768, 1280]) {
  test(`primary controls and data panels fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await mockMarket(page);
    for (const [path, content] of [
      ["/", "Research tools"], ["/watchlist", "Watchlist"], ["/portfolio", "Transaction history"],
      ["/alerts", "Smart Alerts"], ["/screener", "Stock Screener"], ["/rankings/top-gainers", "Top Gainers"],
      ["/compare?symbols=AAPL,PTT.BK", "Compare"], ["/tools/fair-value", "Formula selector"],
      ["/tools/risk-planner", "Risk / Position Size Planner"], ["/stocks/AAPL", "Apple Inc."]
    ]) {
      await page.goto(path);
      await expect(page.getByRole("main").getByText(content, { exact: false }).first()).toBeVisible();
      const main = await page.getByRole("main").boundingBox();
      expect(main?.x).toBeGreaterThanOrEqual(0);
      expect((main?.x ?? 0) + (main?.width ?? 0)).toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      const headerControls = await page.locator("header button:visible").evaluateAll((buttons) =>
        buttons.map((button) => button.getBoundingClientRect().right));
      expect(Math.max(...headerControls)).toBeLessThanOrEqual(width);
    }
    await page.getByRole("button", { name: "Chart settings" }).click();
    const chartButton = await page.getByRole("button", { name: "Heikin-Ashi", exact: true }).boundingBox();
    expect(chartButton?.width).toBeGreaterThan(44);
    expect((chartButton?.x ?? 0) + (chartButton?.width ?? 0)).toBeLessThanOrEqual(width);
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog").getByRole("combobox")).toBeFocused();
    const search = await page.getByRole("dialog").boundingBox();
    expect(search?.x).toBeGreaterThanOrEqual(0);
    expect((search?.x ?? 0) + (search?.width ?? 0)).toBeLessThanOrEqual(width);
  });
}
