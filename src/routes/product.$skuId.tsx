import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addCartItemApi, getProductApi } from "@/lib/api";
import { ApiError } from "@/lib/api/types";
import { useSelectedStoreId } from "@/lib/selected-store";

export const Route = createFileRoute("/product/$skuId")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { skuId } = Route.useParams();
  const storeId = useSelectedStoreId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!storeId) navigate({ to: "/home" });
  }, [storeId, navigate]);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", storeId, skuId],
    queryFn: () => getProductApi(storeId!, skuId),
    enabled: !!storeId,
  });

  const addToCart = useMutation({
    mutationFn: () => addCartItemApi({ storeId: storeId!, skuId, quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add to cart"),
  });

  if (!storeId) return null;

  return (
    <CustomerShell>
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <div className="mb-8 flex items-center gap-2 text-xs font-medium text-on-surface-variant">
          <span
            className="cursor-pointer hover:text-primary"
            onClick={() => navigate({ to: "/home" })}
          >
            Home
          </span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="font-bold text-on-surface">{product?.name ?? "Product"}</span>
        </div>

        {isLoading || !product ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="space-y-6 rounded-2xl border border-outline-variant/30 bg-surface p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                  {product.category ?? "Product"}
                </p>
                <h1 className="text-3xl font-bold">{product.name}</h1>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {product.brand ? `${product.brand} · ` : ""}
                  {product.unitOfMeasure}
                </p>
              </div>
              <div className="text-right">
                {product.compareAtPrice && (
                  <p className="text-sm text-on-surface-variant line-through">
                    ₹{product.compareAtPrice}
                  </p>
                )}
                <p className="text-3xl font-bold text-primary">₹{product.price}</p>
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-on-surface-variant">{product.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">ETA</p>
                  <p className="font-bold">10–15 mins</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                <span className="material-symbols-outlined text-secondary">inventory_2</span>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Stock</p>
                  <p className="font-bold">{product.availableQty} available</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-full border border-outline-variant/20 bg-surface-container-low p-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface font-bold text-primary shadow-sm hover:bg-surface-container-low"
                >
                  −
                </button>
                <span className="text-xl font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.availableQty, q + 1))}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-surface font-bold text-primary shadow-sm hover:bg-surface-container-low"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                className="w-full"
                disabled={product.availableQty === 0 || addToCart.isPending}
                onClick={() => addToCart.mutate()}
              >
                <span className="material-symbols-outlined">
                  {added ? "check_circle" : "shopping_basket"}
                </span>
                {product.availableQty === 0
                  ? "Out of stock"
                  : added
                    ? "Added to Cart"
                    : "Add to Cart"}
              </Button>
            </div>
          </div>
        )}
      </main>
    </CustomerShell>
  );
}
