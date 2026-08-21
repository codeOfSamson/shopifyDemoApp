import { getLandingPageBySlug } from "@/lib/landingPages";
import { getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/app/cart/AddToCartButton";
import { notFound } from "next/navigation";

export default async function CreativeLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const landingPage = await getLandingPageBySlug(slug);
  if (!landingPage) notFound();

  const product = await getProductByHandle(landingPage.productHandle);
  if (!product) notFound();

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <main>
      <h1>{product.title}</h1>
      {landingPage.discountCode && (
        <p>Use code {landingPage.discountCode} at checkout</p>
      )}
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
    </main>
  );
}

// Known/live campaigns get pre-rendered at build time; anything the CMS
// gains after deploy falls back to on-demand generation and gets cached
// (and tag-invalidated) from then on — same pattern as the product PDP.
export async function generateStaticParams() {
  return []; // fill with { slug } for known live campaigns
}
