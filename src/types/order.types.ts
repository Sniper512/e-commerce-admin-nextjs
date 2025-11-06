// Order Types
export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;

  // Items
  items: OrderItem[];

  // Pricing
  subtotal: number;
  discount: number;
  tax: number;
  deliveryFee: number;
  total: number;

  // Payment
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;

  // Delivery
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Status
  status: OrderStatus;

  // Tracking
  trackingNumber?: string;
  riderId?: string;

  // Notes
  customerNotes?: string;
  adminNotes?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  batchId?: string;
}

// Payment Types
export type PaymentMethodType =
  | "easypaisa"
  | "jazzcash"
  | "card"
  | "bank_transfer"
  | "cash_on_delivery";

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  isActive: boolean;
  displayOrder: number;
  instructions?: string;
  accountDetails?: {
    accountNumber?: string;
    accountTitle?: string;
    bankName?: string;
  };
}

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
