import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCartApi, listStoreProductsApi, listStoresApi } from "@/lib/api";
import type { Product } from "@/lib/api/types";
import { setSelectedStoreId, useSelectedStoreId } from "@/lib/selected-store";
import { useAddToCart } from "@/hooks/use-add-to-cart";

export const Route = createFileRoute("/home")({
  component: HomePage,
});

const CATEGORY_STYLES: Record<string, { icon: string; tile: string; text: string }> = {
  Grocery: { icon: "shopping_cart", tile: "bg-primary-container/40", text: "text-primary" },
  Fruits: { icon: "nutrition", tile: "bg-secondary-container/40", text: "text-secondary" },
  Dairy: { icon: "water_drop", tile: "bg-tertiary-container/30", text: "text-tertiary" },
  Snacks: { icon: "fastfood", tile: "bg-error-container/20", text: "text-error" },
};
const DEFAULT_CATEGORY_STYLE = {
  icon: "shopping_bag",
  tile: "bg-surface-container",
  text: "text-on-surface-variant",
};

/** Stable per-product "delivery ETA" for card polish — deterministic, not random, so it doesn't flicker on re-render. */
function etaMinutesFor(skuId: string) {
  let hash = 0;
  for (let i = 0; i < skuId.length; i++) hash = (hash * 31 + skuId.charCodeAt(i)) >>> 0;
  return 9 + (hash % 6);
}

function discountPercent(product: Product) {
  if (!product.compareAtPrice) return null;
  const price = Number(product.price);
  const compareAt = Number(product.compareAtPrice);
  if (!(compareAt > price)) return null;
  return Math.round((1 - price / compareAt) * 100);
}

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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["products", storeId],
    queryFn: () => listStoreProductsApi(storeId),
  });
  const products = useMemo(() => data?.data ?? [], [data]);

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: getCartApi });
  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter((c): c is string => !!c))),
    [products],
  );

  const deals = useMemo(
    () =>
      products
        .map((p) => ({ product: p, pct: discountPercent(p) ?? 0 }))
        .filter((d) => d.pct > 0)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 2),
    [products],
  );

  const filtered = products.filter(
    (p) =>
      (!category || p.category === category) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  const addToCart = useAddToCart(storeId);

  return (
    <CustomerShell searchValue={search} onSearchChange={setSearch}>
      <main className="mx-auto max-w-7xl px-6 pb-16">
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
              <h2 className="font-bold text-primary">Delivering to {storeName}</h2>
              <p className="text-xs text-on-secondary-container">
                Flash delivery active · {storeAddress}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedStoreId(null)}
            className="flex shrink-0 cursor-pointer items-center gap-1 px-4 text-xs font-bold text-primary hover:underline"
          >
            Change Location
            <span className="material-symbols-outlined text-[14px]">edit</span>
          </button>
        </div>

        {!isLoading && (
          <section className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <HeroBanner
              onShopNow={() =>
                document.getElementById("product-grid")?.scrollIntoView({ behavior: "smooth" })
              }
            />
            <FlashSaleCard
              deals={deals}
              onSelect={(p) => navigate({ to: "/product/$skuId", params: { skuId: p.skuId } })}
            />
          </section>
        )}

        {categories.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Shop by Category</h2>
              {category && (
                <button
                  onClick={() => setCategory(null)}
                  className="cursor-pointer text-sm font-bold text-primary hover:underline"
                >
                  See All Categories
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {categories.map((cat) => {
                const style = CATEGORY_STYLES[cat] ?? DEFAULT_CATEGORY_STYLE;
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(active ? null : cat)}
                    className={`group flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl transition-all hover:scale-105 hover:shadow-lg ${style.tile} ${
                      active ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <span className={`material-symbols-outlined text-5xl ${style.text}`}>
                      {style.icon}
                    </span>
                    <p className={`font-bold ${style.text}`}>{cat}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section id="product-grid">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold">{storeName} Exclusives</h2>
              <p className="text-sm text-on-surface-variant">
                Top picks with lightning-fast delivery.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-on-surface-variant">No products match your search.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product.skuId}
                  product={product}
                  onOpen={() =>
                    navigate({ to: "/product/$skuId", params: { skuId: product.skuId } })
                  }
                  onAdd={(e) => {
                    e.stopPropagation();
                    addToCart.mutate({ product });
                  }}
                  adding={addToCart.isPending}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <button
        onClick={() => navigate({ to: "/checkout" })}
        className="fixed right-6 bottom-24 z-30 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-transform active:scale-90 md:right-10 md:bottom-10"
      >
        <span className="material-symbols-outlined text-3xl">shopping_bag</span>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-destructive text-[10px] font-bold text-destructive-foreground">
            {cartCount}
          </span>
        )}
      </button>
    </CustomerShell>
  );
}

function HeroBanner({ onShopNow }: { onShopNow: () => void }) {
  return (
    <div className="relative flex h-80 flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-tertiary p-10 shadow-lg lg:col-span-2">
      <span className="material-symbols-outlined pointer-events-none absolute -top-6 -right-6 text-[220px] text-white/10">
        nutrition
      </span>
      <span className="mb-4 w-fit rounded-full bg-white px-3 py-1 text-[10px] font-bold text-primary">
        SEASONAL SPECIALS
      </span>
      <h1 className="mb-3 text-4xl leading-tight font-bold text-white">
        Fresh Harvest:
        <br />
        Up to 40% Off
      </h1>
      <p className="mb-6 max-w-sm text-sm text-white/80">
        Farm-to-door freshness delivered in minutes.
      </p>
      <button
        onClick={onShopNow}
        className="w-fit cursor-pointer rounded-full bg-white px-8 py-3 font-bold text-primary shadow-xl transition-all hover:scale-105 hover:bg-primary-container"
      >
        Shop All Fresh
      </button>
    </div>
  );
}

function FlashSaleCard({
  deals,
  onSelect,
}: {
  deals: { product: Product; pct: number }[];
  onSelect: (p: Product) => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(2 * 3600 + 45 * 60 + 12);

  useEffect(() => {
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
  const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
  const s = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="flex flex-col rounded-3xl border border-primary/10 bg-primary-container/20 p-8">
      <div className="flex-1">
        <h3 className="mb-1 text-xl font-bold text-primary">Flash Sale</h3>
        <p className="text-xs font-medium text-on-surface-variant">
          Ends in {h}:{m}:{s}
        </p>
        <div className="mt-6 space-y-3">
          {deals.length === 0 ? (
            <p className="text-xs text-on-surface-variant">No active deals right now.</p>
          ) : (
            deals.map(({ product }) => {
              const style = CATEGORY_STYLES[product.category ?? ""] ?? DEFAULT_CATEGORY_STYLE;
              return (
                <div
                  key={product.skuId}
                  onClick={() => onSelect(product)}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl bg-white/60 p-3 transition-colors hover:bg-white"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.tile}`}
                  >
                    <span className={`material-symbols-outlined text-xl ${style.text}`}>
                      {style.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{product.name}</p>
                    <p className="font-bold text-primary">
                      ₹{product.price}
                      <span className="ml-1 text-xs font-normal text-on-surface-variant line-through">
                        ₹{product.compareAtPrice}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onOpen,
  onAdd,
  adding,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: (e: React.MouseEvent) => void;
  adding: boolean;
}) {
  const style = CATEGORY_STYLES[product.category ?? ""] ?? DEFAULT_CATEGORY_STYLE;
  const pct = discountPercent(product);
  const eta = etaMinutesFor(product.skuId);

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface transition-all hover:shadow-xl"
      onClick={onOpen}
    >
      <div
        className={`relative flex h-40 items-center justify-center ${style.tile} overflow-hidden`}
      >
        <span
          className={`material-symbols-outlined text-6xl ${style.text} transition-transform group-hover:scale-110`}
        >
          {style.icon}
        </span>
        {pct !== null && (
          <div className="absolute top-3 left-3 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-white">
            {pct}% OFF
          </div>
        )}
        <div className="glass-card absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2 py-1">
          <span className="material-symbols-outlined text-sm font-bold text-primary">bolt</span>
          <span className="text-[10px] font-bold text-primary">{eta} min</span>
        </div>
      </div>
      <div className="p-5">
        <p className="mb-1 text-[10px] font-bold tracking-wider text-primary uppercase">
          {product.category ?? "Product"}
        </p>
        <h3 className="mb-1 line-clamp-1 text-sm font-bold">{product.name}</h3>
        {product.description && (
          <p className="mb-4 line-clamp-2 text-xs text-on-surface-variant">{product.description}</p>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">₹{product.price}</p>
            {product.compareAtPrice && (
              <p className="text-[10px] font-medium text-on-surface-variant line-through">
                ₹{product.compareAtPrice}
              </p>
            )}
          </div>
          <Button size="sm" disabled={product.availableQty === 0 || adding} onClick={onAdd}>
            <span className="material-symbols-outlined text-[16px]">add</span>
            {product.availableQty === 0 ? "Sold out" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
