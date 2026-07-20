import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addCartItemApi, listStoreProductsApi, listStoresApi } from "@/lib/api";
import { ApiError } from "@/lib/api/types";
import type { Product } from "@/lib/api/types";
import { setSelectedStoreId, useSelectedStoreId } from "@/lib/selected-store";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

const CATEGORY_ICONS: Record<string, string> = {
  Grocery: "shopping_cart",
  Fruits: "nutrition",
  Dairy: "water_drop",
  Snacks: "fastfood",
};

function HomePage() {
  const storeId = useSelectedStoreId();
  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: listStoresApi,
  });
  const stores = storesData?.data ?? [];
  const selectedStore = stores.find((s) => s.id === storeId);

  if (!storeId || !selectedStore) {
    return (
      <CustomerShell>
        <StorePicker stores={stores} loading={storesLoading} />
      </CustomerShell>
    );
  }

  return (
    <StoreHome
      storeId={storeId}
      storeName={selectedStore.name}
      storeAddress={selectedStore.address}
    />
  );
}

function StorePicker({
  stores,
  loading,
}: {
  stores: { id: string; name: string; address: string }[];
  loading: boolean;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="mb-2 text-3xl font-bold">Choose your delivery store</h1>
      <p className="mb-10 text-sm text-on-surface-variant">
        Pick the dark store closest to you to start shopping.
      </p>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : stores.length === 0 ? (
        <p className="text-on-surface-variant">No active stores available right now.</p>
      ) : (
        <div className="space-y-4">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStoreId(store.id)}
              className="flex w-full cursor-pointer items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-5 text-left transition-all hover:border-primary hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  storefront
                </span>
              </div>
              <div>
                <p className="font-bold text-on-surface">{store.name}</p>
                <p className="text-xs text-on-surface-variant">{store.address}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

function StoreHome({
  storeId,
  storeName,
  storeAddress,
}: {
  storeId: string;
  storeName: string;
  storeAddress: string;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["products", storeId],
    queryFn: () => listStoreProductsApi(storeId),
  });
  const products = data?.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))),
    [products],
  );

  const filtered = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  const addToCart = useMutation({
    mutationFn: (product: Product) =>
      addCartItemApi({ storeId, skuId: product.skuId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add to cart"),
  });

  return (
    <CustomerShell searchValue={search} onSearchChange={setSearch}>
      <main className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-full border border-primary/10 bg-secondary-container/50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
            </div>
            <div>
              <h2 className="font-bold text-primary">{storeName}</h2>
              <p className="text-xs text-on-secondary-container">{storeAddress}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStoreId(null)}
            className="cursor-pointer px-4 text-xs font-bold text-primary hover:underline"
          >
            Change
          </button>
        </div>

        {categories.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-wrap gap-3">
              <CategoryChip label="All" active={!category} onClick={() => setCategory(null)} />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat}
                  label={cat}
                  icon={CATEGORY_ICONS[cat]}
                  active={category === cat}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="pb-16">
          <h2 className="mb-2 text-2xl font-bold">Shop {storeName}</h2>
          <p className="mb-8 text-sm text-on-surface-variant">Fresh picks, delivered fast.</p>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-on-surface-variant">No products match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((product) => (
                <div
                  key={product.skuId}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface transition-all hover:shadow-xl"
                  onClick={() =>
                    navigate({ to: "/product/$skuId", params: { skuId: product.skuId } })
                  }
                >
                  <div className="relative flex h-40 items-center justify-center bg-surface-container">
                    <span className="material-symbols-outlined text-5xl text-outline-variant">
                      {CATEGORY_ICONS[product.category ?? ""] ?? "shopping_bag"}
                    </span>
                    {product.compareAtPrice && (
                      <div className="absolute top-3 left-3 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white">
                        SALE
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
                      {product.category ?? "Product"}
                    </p>
                    <h3 className="mb-4 line-clamp-1 text-sm font-bold">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">₹{product.price}</p>
                        {product.compareAtPrice && (
                          <p className="text-[10px] font-medium text-on-surface-variant line-through">
                            ₹{product.compareAtPrice}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        disabled={product.availableQty === 0 || addToCart.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart.mutate(product);
                        }}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </CustomerShell>
  );
}

function CategoryChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-surface-container text-on-surface-variant hover:bg-primary/10"
      }`}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {label}
    </button>
  );
}
