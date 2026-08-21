import { getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/app/cart/AddToCartButton";
import { notFound } from "next/navigation";

// Fixes "Exercise 1" class of issue: don't let a missing product 500,
// and don't let an out-of-stock variant reach the cart mutation.
export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const firstVariant = product.variants.edges[0]?.node;
  const secondVariant = product.variants.edges[1]?.node;
  console.log(secondVariant);

  return (
    <main>
      <h1>{product.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      <p>
        {firstVariant?.price.amount} {firstVariant?.price.currencyCode}
      </p>
      {firstVariant && (
        <AddToCartButton
          merchandiseId={firstVariant.id}
          available={firstVariant.availableForSale}
        />
      )}

      <p>
        {secondVariant?.price.amount} {secondVariant?.price.currencyCode}
      </p>
      {secondVariant && (
        <AddToCartButton
          merchandiseId={secondVariant.id}
          available={secondVariant.availableForSale}
        />
      )}
    </main>
  );
}

// Static params for known products at build time — marketing-heavy catalogs
// still get most pages pre-rendered; anything new falls back to on-demand
// generation and gets cached going forward.
export async function generateStaticParams() {
  return []; // fill with { handle } objects from a collection query if desired
}
