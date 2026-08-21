import { Card } from "@repo/ui";
import { withLatency } from "@repo/utils";
import { stockStatus } from "@/lib/lowStock";
import type { InventoryProduct } from "@/lib/shopifyAdmin";

type Recommendation = {
  id: string;
  label: string;
  available: number;
};

async function computeRecommendations(products: InventoryProduct[]): Promise<Recommendation[]> {
  return products
    .flatMap((product) =>
      product.variants
        .filter((variant) => stockStatus(variant.available) !== "in-stock")
        .map((variant) => ({
          id: variant.id,
          label: `${product.title} — ${variant.title}`,
          available: variant.available,
        })),
    )
    .slice(0, 5);
}

// Deliberately slower than the main product query — this is what makes
// the Suspense boundary in app/page.tsx visibly stream in after the rest
// of the page, rather than resolving too fast to notice.
const computeRecommendationsSlowly = withLatency(computeRecommendations, { minMs: 800, maxMs: 1600 });

export async function ReorderRecommendations({ products }: { products: InventoryProduct[] }) {
  const recommendations = await computeRecommendationsSlowly(products);

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900">Reorder recommendations</h2>
      {recommendations.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">Nothing low on stock right now.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2 text-sm text-slate-700">
          {recommendations.map((rec) => (
            <li key={rec.id} className="flex justify-between">
              <span>{rec.label}</span>
              <span className="text-slate-500">{rec.available} left</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
