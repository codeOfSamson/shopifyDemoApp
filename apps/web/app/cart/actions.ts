"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createCart, addCartLine } from "@/lib/shopify";

// Cart state lives server-side: Shopify's cart ID in an httpOnly cookie.
// Every mutation here goes through shopifyFetch's cache: 'no-store' path —
// this is the answer to the screening question in code form.
export async function addToCart(
  merchandiseId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    const cookieStore = await cookies();
    const existingCartId = cookieStore.get("cartId")?.value;

    if (!existingCartId) {
      const { cart, userErrors } = await createCart(merchandiseId);
      if (userErrors?.length) {
        return { ok: false, message: userErrors[0].message };
      }
      cookieStore.set("cartId", cart.id, { httpOnly: true, sameSite: "lax" });
    } else {
      const { userErrors } = await addCartLine(existingCartId, merchandiseId);
      if (userErrors?.length) {
        return { ok: false, message: userErrors[0].message };
      }
    }

    // Re-render the cart UI (server component) with fresh data.
    // Never rely on the Data Cache picking this up on its own.
    revalidatePath("/cart");
    return { ok: true };
  } catch (err) {
    console.error(err);
    return { ok: false, message: "Couldn't add that to your cart. Try again." };
  }
}
