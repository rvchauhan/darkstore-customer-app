import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addCartItemApi, clearCartApi } from "@/lib/api";
import { ApiError } from "@/lib/api/types";
import type { Product } from "@/lib/api/types";

/**
 * Shared add-to-cart mutation (used by both the Home grid and Product
 * Detail). A cart can only hold items from one store at a time — the API
 * returns 409 STORE_MISMATCH if the customer already has items from a
 * different store. Rather than dead-ending on that error, offer a one-click
 * "Clear cart" action that clears the old cart and retries the add.
 */
export function useAddToCart(storeId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ product, quantity = 1 }: { product: Product; quantity?: number }) =>
      addCartItemApi({ storeId, skuId: product.skuId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (err, { product, quantity }) => {
      if (err instanceof ApiError && err.code === "STORE_MISMATCH") {
        toast.error("Your cart has items from a different store", {
          description: "Clear it to order from this store instead.",
          action: {
            label: "Clear cart",
            onClick: async () => {
              try {
                await clearCartApi();
                await queryClient.invalidateQueries({ queryKey: ["cart"] });
                mutation.mutate({ product, quantity });
              } catch {
                toast.error("Could not clear cart — try again");
              }
            },
          },
        });
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Could not add to cart");
    },
  });

  return mutation;
}
