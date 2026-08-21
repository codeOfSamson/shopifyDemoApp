// Admin API client — separate from apps/web/lib/shopify.ts (Storefront
// API). Requires a private Admin API access token (server-only,
// read_products + read_inventory + read_locations scopes). See
// .env.local.example for how to create one.

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const adminToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const apiVersion = "2026-07";

export function hasAdminCredentials(): boolean {
  return Boolean(domain && adminToken);
}

async function shopifyAdminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!hasAdminCredentials()) {
    throw new Error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN");
  }

  const res = await fetch(`https://${domain}/admin/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken!,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store", // inventory levels change too often to cache
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(`Shopify Admin API error: ${json.errors.map((e: { message: string }) => e.message).join(", ")}`);
  }

  return json.data as T;
}

export type InventoryVariant = {
  id: string;
  title: string;
  sku: string | null;
  price: string;
  available: number;
};

export type InventoryProduct = {
  id: string;
  title: string;
  handle: string;
  variants: InventoryVariant[];
};

const INVENTORY_PRODUCTS_QUERY = /* GraphQL */ `
  query InventoryProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          variants(first: 25) {
            edges {
              node {
                id
                title
                sku
                price
                inventoryItem {
                  inventoryLevels(first: 5) {
                    edges {
                      node {
                        quantities(names: ["available"]) {
                          name
                          quantity
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

type RawInventoryLevelEdge = {
  node: { quantities: { name: string; quantity: number }[] };
};

function sumAvailable(levelEdges: RawInventoryLevelEdge[]): number {
  return levelEdges.reduce((total, levelEdge) => {
    const availableQty = levelEdge.node.quantities.find((q) => q.name === "available");
    return total + (availableQty?.quantity ?? 0);
  }, 0);
}

// Shopify's Admin API returns GraphQL nodes as loosely-typed JSON; `node`
// is typed `any` here deliberately, mirroring the same pattern already
// used in apps/web/lib/shopify.ts for the Storefront API responses.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toInventoryProduct(node: any): InventoryProduct {
  return {
    id: node.id,
    title: node.title,
    handle: node.handle,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: node.variants.edges.map((edge: any) => ({
      id: edge.node.id,
      title: edge.node.title,
      sku: edge.node.sku || null,
      price: edge.node.price,
      available: sumAvailable(edge.node.inventoryItem.inventoryLevels.edges),
    })),
  };
}

export async function listInventoryProducts(
  options: { first?: number; after?: string; searchQuery?: string } = {},
): Promise<{ products: InventoryProduct[]; hasNextPage: boolean; endCursor: string | null }> {
  const { first = 50, after, searchQuery } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await shopifyAdminFetch<{ products: any }>(INVENTORY_PRODUCTS_QUERY, {
    first,
    after,
    query: searchQuery,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: data.products.edges.map((edge: any) => toInventoryProduct(edge.node)),
    hasNextPage: data.products.pageInfo.hasNextPage,
    endCursor: data.products.pageInfo.endCursor,
  };
}
