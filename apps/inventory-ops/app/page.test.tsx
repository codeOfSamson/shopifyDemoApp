import { render, screen } from "@testing-library/react";
import InventoryPage from "./page";

// The credentials-fallback branch is the only UI path a reviewer without
// a real Shopify Admin API token can actually see — this covers it.
jest.mock("@/lib/shopifyAdmin", () => ({
  hasAdminCredentials: jest.fn(() => false),
  listInventoryProducts: jest.fn(),
}));

describe("InventoryPage", () => {
  it("renders the connect-your-token card when hasAdminCredentials() is false", async () => {
    // InventoryPage is an async Server Component: resolve it to JSX first,
    // then render — the standard RTL pattern for testing these.
    const ui = await InventoryPage();
    render(ui);

    expect(
      screen.getByRole("heading", { name: /connect your shopify admin api token/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("SHOPIFY_ADMIN_API_ACCESS_TOKEN")).toBeInTheDocument();
  });
});
