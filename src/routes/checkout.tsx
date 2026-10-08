import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/CustomerShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { checkoutApi, getCartApi, removeCartItemApi, updateCartItemApi } from "@/lib/api";
import { ApiError, formatOrderLabel } from "@/lib/api/types";
import { setSelectedStoreId } from "@/lib/selected-store";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const HANDLING_FEE = 2;

function CheckoutPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const { data: cart, isLoading } = useQuery({ queryKey: ["cart"], queryFn: getCartApi });

  const updateQuantity = useMutation({
    mutationFn: ({ skuId, quantity }: { skuId: string; quantity: number }) =>
      quantity === 0 ? removeCartItemApi(skuId) : updateCartItemApi(skuId, quantity),
    onSuccess: (data) => queryClient.setQueryData(["cart"], data),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update cart"),
  });

  const checkout = useMutation({
    mutationFn: () =>
      checkoutApi({
        deliveryAddress: { line1, city, postalCode, phone },
        paymentMethod,
      }),
    onSuccess: ({ order }) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      // Cart is empty after checkout — clear the remembered store so the next
      // visit to Home re-prompts (customer may order from a different store).
      setSelectedStoreId(null);
      toast.success(`Order placed! ${formatOrderLabel(order)}`);
      navigate({ to: "/orders" });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Checkout failed"),
  });

  const itemsTotal = Number(cart?.itemsTotal ?? "0");
  const totalAmount = itemsTotal + HANDLING_FEE;
  const hasItems = (cart?.items.length ?? 0) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    checkout.mutate();
  }

  return (
    <CustomerShell>
      <div className="sticky top-16 z-30 border-b border-outline-variant bg-surface px-6 py-4">
        <h1 className="text-xl font-bold">Checkout</h1>
      </div>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-8 pb-16 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
            <h2 className="mb-6 text-lg font-bold">Cart Items</h2>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !hasItems ? (
              <p className="text-sm text-on-surface-variant">
                Your cart is empty.{" "}
                <span
                  className="cursor-pointer font-bold text-primary hover:underline"
                  onClick={() => navigate({ to: "/home" })}
                >
                  Browse products
                </span>
              </p>
            ) : (
              <div className="space-y-6">
                {cart!.items.map((item) => (
                  <div
                    key={item.skuId}
                    className="flex items-center gap-4 border-b border-outline-variant/20 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-container">
                      <span className="material-symbols-outlined text-2xl text-outline-variant">
                        shopping_bag
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.quantity} unit{item.quantity > 1 ? "s" : ""} · ₹{item.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="h-8 w-8 cursor-pointer rounded-full border border-outline-variant"
                        onClick={() =>
                          updateQuantity.mutate({ skuId: item.skuId, quantity: item.quantity - 1 })
                        }
                      >
                        −
                      </button>
                      <span className="font-bold">{item.quantity}</span>
                      <button
                        className="h-8 w-8 cursor-pointer rounded-full border border-outline-variant"
                        onClick={() =>
                          updateQuantity.mutate({ skuId: item.skuId, quantity: item.quantity + 1 })
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-outline-variant/30 bg-surface p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h2 className="font-bold">Delivery Address</h2>
            </div>
            <form
              id="checkout-form"
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <Label htmlFor="line1">Address</Label>
                <Input
                  id="line1"
                  className="mt-1.5"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  className="mt-1.5"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal code</Label>
                <Input
                  id="postalCode"
                  className="mt-1.5"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  className="mt-1.5"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </form>
          </section>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-outline-variant/30 bg-surface p-6 shadow-sm">
            <h2 className="mb-4 font-bold">Payment Method</h2>
            <div className="space-y-3">
              {[
                {
                  id: "upi" as const,
                  name: "UPI",
                  desc: "Google Pay, PhonePe, Paytm",
                  icon: "account_balance_wallet",
                },
                {
                  id: "card" as const,
                  name: "Card",
                  desc: "Visa, Mastercard",
                  icon: "credit_card",
                },
              ].map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {method.icon}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{method.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{method.desc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="pay"
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="sticky top-40 rounded-2xl border border-outline-variant bg-surface p-8 shadow-xl">
            <h2 className="mb-6 text-lg font-bold">Order Summary</h2>
            <div className="mb-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Items Total</span>
                <span className="font-bold">₹{itemsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Delivery Fee</span>
                <span className="font-bold text-primary">FREE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Handling Fee</span>
                <span className="font-bold">₹{HANDLING_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-4 text-lg">
                <span className="font-bold">Total Amount</span>
                <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <Button
              form="checkout-form"
              type="submit"
              size="lg"
              className="w-full"
              disabled={!hasItems || checkout.isPending}
            >
              Pay & Place Order
            </Button>
          </section>
        </div>
      </main>
    </CustomerShell>
  );
}
