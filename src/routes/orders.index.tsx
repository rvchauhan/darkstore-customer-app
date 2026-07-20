import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CustomerShell } from "@/components/CustomerShell";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listOrdersApi } from "@/lib/api";

export const Route = createFileRoute("/orders/")({
  component: OrdersPage,
});

const STATUS_TONE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  placed: "secondary",
  confirmed: "default",
  preparing: "default",
  out_for_delivery: "default",
  delivered: "outline",
  cancelled: "destructive",
};

function OrdersPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: listOrdersApi });
  const orders = data?.data ?? [];

  return (
    <CustomerShell>
      <main className="mx-auto max-w-3xl px-6 py-8 pb-16">
        <h1 className="mb-8 text-2xl font-bold">Your Orders</h1>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface p-10 text-center">
            <p className="mb-4 text-on-surface-variant">You haven't placed any orders yet.</p>
            <button
              className="cursor-pointer font-bold text-primary hover:underline"
              onClick={() => navigate({ to: "/home" })}
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-outline-variant/30 bg-surface p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-on-surface-variant">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={STATUS_TONE[order.status] ?? "outline"} className="uppercase">
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-outline-variant/20 pt-4 text-sm">
                  <span className="text-on-surface-variant">
                    {order.paymentMethod.toUpperCase()}
                  </span>
                  <span className="font-bold">₹{order.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </CustomerShell>
  );
}
