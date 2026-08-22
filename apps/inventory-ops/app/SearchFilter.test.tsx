import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SearchFilter } from "./SearchFilter";
import { searchInventory } from "./actions";
import type { InventoryRow } from "@/lib/inventoryRow";
import type { InventoryProduct } from "@/lib/shopifyAdmin";

jest.mock("./actions", () => ({
  searchInventory: jest.fn(),
}));

const mockedSearchInventory = searchInventory as jest.MockedFunction<typeof searchInventory>;

const sampleRow: InventoryRow = {
  key: "gid://shopify/ProductVariant/1",
  productTitle: "Sample Product",
  variantTitle: "Default",
  sku: "SKU-1",
  price: "10.00",
  available: 5,
};

describe("SearchFilter", () => {
  beforeEach(() => {
    mockedSearchInventory.mockReset();
  });

  it("dims the table while a search is pending, then un-dims once it resolves", async () => {
    let resolveSearch!: (products: InventoryProduct[]) => void;
    mockedSearchInventory.mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );

    const { container } = render(<SearchFilter initialRows={[sampleRow]} />);
    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "widget" },
    });

    await waitFor(() => {
      expect(container.querySelector(".opacity-50")).not.toBeNull();
    });

    resolveSearch([]);

    await waitFor(() => {
      expect(container.querySelector(".opacity-50")).toBeNull();
    });
  });

  it("shows 'No matching products.' when a search returns no results", async () => {
    mockedSearchInventory.mockResolvedValue([]);

    render(<SearchFilter initialRows={[sampleRow]} />);
    fireEvent.change(screen.getByLabelText("Search inventory"), {
      target: { value: "nonexistent" },
    });

    expect(await screen.findByText("No matching products.")).toBeInTheDocument();
  });
});
