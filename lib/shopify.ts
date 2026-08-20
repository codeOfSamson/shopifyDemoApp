// Thin wrapper around Shopify's Storefront API (GraphQL, all requests POST).
// Bundle stays lean by avoiding a heavy SDK — this is a common real-world choice.

const domain = process.env.SHOPIFY_STORE_DOMAIN; // e.g. your-store.myshopify.com
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const apiVersion = "2026-07"; // bump periodically per Shopify's release notes

type ShopifyFetchOptions = {
  query: string;
  variables?: Record<string, unknown>;
  // Tags let us invalidate this exact query later via revalidateTag(),
  // instead of guessing at a blanket time-based revalidation window.
  tags?: string[];
  // Cart mutations must NEVER hit the shared Data Cache — force no-store.
  cache?: RequestCache;
};

export async function shopifyFetch<T>({
  query,
  variables,
  tags,
  cache,
}: ShopifyFetchOptions): Promise<T> {
  const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token!,
    },
    body: JSON.stringify({ query, variables }),
    // Product/collection reads: cacheable, tagged for on-demand invalidation.
    // Cart reads/writes: pass cache: 'no-store' from the caller.
    ...(cache ? { cache } : { next: { tags } }),
  });

  console.log(cache, "from call shopify Fetch");

  const json = await res.json();

  if (json.errors) {
    // Don't let a raw GraphQL error blob leak to the UI — this is exactly
    // the kind of thing a PDP audit flags.
    throw new Error(
      `Shopify Storefront API error: ${json.errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  return json.data as T;
}

// ---- Reads (cacheable, tagged) ----

const PRODUCT_QUERY = /* GraphQL */ `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      descriptionHtml
      variants(first: 25) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export async function getProductByHandle(handle: string) {
  const data = await shopifyFetch<{ product: any }>({
    query: PRODUCT_QUERY,
    variables: { handle },
    tags: [`product:${handle}`], // webhook handler revalidates this exact tag
  });
  return data.product;
}

// ---- Cart mutations (never cached) ----

const CART_CREATE = /* GraphQL */ `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        totalQuantity
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export async function createCart(merchandiseId: string, quantity = 1) {
  const data = await shopifyFetch<{ cartCreate: any }>({
    query: CART_CREATE,
    variables: { lines: [{ merchandiseId, quantity }] },
    cache: "no-store", // per-user, must not enter the shared Data Cache
  });
  return data.cartCreate;
}

export async function addCartLine(
  cartId: string,
  merchandiseId: string,
  quantity = 1,
) {
  const data = await shopifyFetch<{ cartLinesAdd: any }>({
    query: CART_LINES_ADD,
    variables: { cartId, lines: [{ merchandiseId, quantity }] },
    cache: "no-store",
  });
  return data.cartLinesAdd;
}

// ---- Cart read (also never cached — same per-user reasoning as the mutations) ----

const CART_QUERY = /* GraphQL */ `
  query Cart($cartId: ID!) {
    cart(id: $cartId) {
      id
      checkoutUrl
      totalQuantity
      cost {
        totalAmount {
          amount
          currencyCode
        }
      }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getCart(cartId: string) {
  const data = await shopifyFetch<{ cart: any }>({
    query: CART_QUERY,
    variables: { cartId },
    cache: "no-store", // per-user, must not enter the shared Data Cache
  });
  return data.cart;
}
