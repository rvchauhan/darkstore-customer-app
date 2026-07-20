import { apiRequest } from "./client";
import type { Cart, Customer, DeliveryAddress, Order, OrderItem, Product, Store } from "./types";

// --- Customer auth ---

export function loginApi(email: string, password: string) {
  return apiRequest<{ token: string; customer: Customer }>("/api/customer-auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function registerApi(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  return apiRequest<{ token: string; customer: Customer }>("/api/customer-auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function googleAuthApi(idToken: string) {
  return apiRequest<{ token: string; customer: Customer }>("/api/customer-auth/google", {
    method: "POST",
    body: { idToken },
    auth: false,
  });
}

export function meApi() {
  return apiRequest<{ customer: Customer }>("/api/customer-auth/me");
}

// --- Storefront (browsing) ---

export function listStoresApi() {
  return apiRequest<{ data: Store[] }>("/api/storefront/stores");
}

export function listStoreProductsApi(storeId: string) {
  return apiRequest<{ data: Product[] }>(`/api/storefront/stores/${storeId}/products`);
}

export function getProductApi(storeId: string, skuId: string) {
  return apiRequest<Product>(`/api/storefront/stores/${storeId}/products/${skuId}`);
}

// --- Cart ---

export function getCartApi() {
  return apiRequest<Cart>("/api/cart");
}

export function addCartItemApi(input: { storeId: string; skuId: string; quantity: number }) {
  return apiRequest<Cart>("/api/cart/items", { method: "POST", body: input });
}

export function updateCartItemApi(skuId: string, quantity: number) {
  return apiRequest<Cart>(`/api/cart/items/${skuId}`, { method: "PATCH", body: { quantity } });
}

export function removeCartItemApi(skuId: string) {
  return apiRequest<Cart>(`/api/cart/items/${skuId}`, { method: "DELETE" });
}

export function clearCartApi() {
  return apiRequest<{ cleared: boolean }>("/api/cart", { method: "DELETE" });
}

// --- Orders ---

export function checkoutApi(input: {
  deliveryAddress: DeliveryAddress;
  paymentMethod: "upi" | "card";
}) {
  return apiRequest<{ order: Order; items: OrderItem[] }>("/api/orders", {
    method: "POST",
    body: input,
  });
}

export function listOrdersApi() {
  return apiRequest<{ data: Order[] }>("/api/orders");
}

export function getOrderApi(orderId: string) {
  return apiRequest<{ order: Order; items: OrderItem[] }>(`/api/orders/${orderId}`);
}
