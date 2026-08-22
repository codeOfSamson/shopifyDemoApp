import { test, expect } from "@playwright/test";

// Assumes a product with handle "shoes" exists in the connected Shopify
// dev store (referenced by apps/web/lib/landingPages.ts's mock CMS entry
// too) — adjust the handle below if your catalog uses a different one.
test("adding a product to the cart updates the cart page", async ({ page }) => {
  await page.goto("/products/shoes");
  // AddToCartButton calls the addToCart server action inside a React
  // useTransition — the click resolves as soon as the event dispatches, well
  // before the server action (and its cartId cookie write) completes. Wait
  // for that POST to land before navigating, or /cart loads ahead of the
  // cookie being set and this becomes a flaky race.
  await Promise.all([
    page.waitForResponse(
      (res) => res.request().method() === "POST" && res.url().includes("/products/shoes"),
    ),
    page.getByRole("button", { name: "Add to cart" }).click(),
  ]);
  await page.goto("/cart");
  await expect(page.getByText(/Total:/)).toBeVisible();
});
