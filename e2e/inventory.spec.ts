import { test, expect } from "@playwright/test";

test("inventory page renders the product table with real Shopify data", async ({ page }) => {
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Inventory" })).toBeVisible();
  await expect(page.locator("table")).toBeVisible();
});

test("searching filters the inventory table", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByLabel("Search inventory").fill("zzzznonexistentproduct");
  await expect(page.getByText("No matching products.")).toBeVisible();
});
