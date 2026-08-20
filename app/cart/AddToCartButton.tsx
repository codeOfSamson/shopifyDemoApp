"use client";

import { useTransition, useState } from "react";
import { addToCart } from "./actions";

// Directly addresses the PDP audit scenario in PRACTICE.md Exercise 1:
// disabled when out of stock, pending state prevents double-submit,
// errors are caught and shown inline instead of leaking a raw exception.
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
    console.log("[browser] handleClick fired", merchandiseId);
    setError(null);
    startTransition(async () => {
      const result = await addToCart(merchandiseId);
      if (!result.ok) setError(result.message);
    });
  }

  if (!available) {
    return <button disabled>Out of stock</button>;
  }

  return (
    <div>
      <button onClick={handleClick} disabled={isPending}>
        {isPending ? "Adding…" : "Add to cart"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
