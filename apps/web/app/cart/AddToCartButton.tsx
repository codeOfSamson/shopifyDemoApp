"use client";

import { useTransition, useState } from "react";
import { Button } from "@repo/ui";
import { addToCart } from "./actions";

export function AddToCartButton({
  merchandiseId,
  available,
}: {
  merchandiseId: string;
  available: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await addToCart(merchandiseId);
      if (!result.ok) setError(result.message ?? "Something went wrong.");
    });
  }

  if (!available) {
    return (
      <Button variant="secondary" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Adding…" : "Add to cart"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
