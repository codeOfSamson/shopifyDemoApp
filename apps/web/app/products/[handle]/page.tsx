import { getProductByHandle } from "@/lib/shopify";
import { AddToCartButton } from "@/app/cart/AddToCartButton";
import { Card } from "@repo/ui";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const firstVariant = product.variants.edges[0]?.node;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Card>
        <h1 className="text-2xl font-semibold">{product.title}</h1>
        <div
          className="prose prose-slate mt-4 max-w-none"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
        />
        <p className="mt-4 text-lg font-medium">
          {firstVariant?.price.amount} {firstVariant?.price.currencyCode}
        </p>
        {firstVariant && (
          <div className="mt-4">
            <AddToCartButton merchandiseId={firstVariant.id} available={firstVariant.availableForSale} />
          </div>
        )}
      </Card>
    </main>
  );
}

export async function generateStaticParams() {
  return [];
}
