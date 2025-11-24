import { PaymentMethod, PaymentMethodType } from "./payment_method.types";

// Order Types
export type OrderStatus =
  | "pending" // When order is created
  | "confirmed" // When admin confirms the order
  | "shipped" // When order is shipped
  | "delivered" // When order is delivered to customer
  | "cancelled" // When admin or user cancels the order
  | "refunded"; // When order is refunded

export type PaymentStatus =
  | "pending" // Either payment method not selected or cash on delivery selected
  | "awaiting_confirmation" // For online payments, waiting for payment confirmation by admin
  | "confirmed" // Payment confirmed by admin
  | "refunded" // Payment refunded
  | "cancelled"; // Payment cancelled

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
  proofOfPaymentUrl?: string;

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
