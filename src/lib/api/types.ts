/**
 * Hand-matched to dark-store-api's customer-facing responses — same
 * "duplicated by hand, no shared package" convention as the portal.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type Customer = {
  customerId: string;
  email: string;
  name: string;
};

export type Store = {
  id: string;
  name: string;
  address: string;
  geofence: unknown;
};

export type Product = {
  skuId: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: string;
  compareAtPrice: string | null;
  unitOfMeasure: string;
  images: string[];
  description: string | null;
  availableQty: number;
};

export type CartItem = {
  skuId: string;
  name: string;
  image: string | null;
  price: string;
  quantity: number;
  lineTotal: string;
};

export type Cart = {
  cartId: string | null;
  storeId: string | null;
  items: CartItem[];
  itemsTotal: string;
};

export type DeliveryAddress = {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
  phone: string;
};

export type Order = {
  id: string;
  orderNumber: string | null;
  customerId: string;
  businessId: string;
  storeId: string;
  status: string;
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  itemsTotal: string;
  deliveryFee: string;
  handlingFee: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  skuId: string;
  nameSnapshot: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
};

export function formatOrderLabel(order: { id: string; orderNumber?: string | null }): string {
  return order.orderNumber ?? `#${order.id.slice(0, 8)}`;
}
