import { PaymentMethod, PaymentMethodType } from "./payment_method.types";

// Order Types
export type OrderStatus =
  | "placed" // When user provides address and clicks place order
  | "pending_confirmation" // When user selects payment method
  | "confirmed" // When admin confirms the order
  | "delivered" // When order is delivered to customer
  | "cancelled" // When admin or user cancels the order
  | "refunded"; // When order is refunded

export type PaymentStatus =
  | "pending" // Either payment method not selected or cash on delivery selected
  | "pending_confirmation" // For online payments, waiting for payment confirmation by admin
  | "paid" // Payment confirmed by admin
  | "refunded"; // Payment refunded

export interface Order {
  id: string;
  customerId: string;

  // Items
  items: OrderItem[];

  // Pricing
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentStatusHistory: {
    status: PaymentStatus;
    updatedAt: Date;
  }[];

  // Delivery
  deliveryAddress: string;

  // Status
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    updatedAt: Date;
  }[];

  riderId?: string;

  // Timestamps
  createdAt: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  batchId: string;
}

// extras
export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  status: PaymentStatus;
  transactionId?: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Refund Types
export interface Refund {
  id: string;
  orderId: string;
  customerId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  processedBy?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
