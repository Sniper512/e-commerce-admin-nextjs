// Analytics & Reports Types
import type { Order, PaymentMethodType } from "./order.types";

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
  }[];
  topCategories: {
    categoryId: string;
    categoryName: string;
    revenue: number;
  }[];
  salesByPaymentMethod: {
    method: PaymentMethodType;
    count: number;
    amount: number;
  }[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  expiryAlertsCount: number;
  pendingOrdersCount: number;
  recentOrders: Order[];
  topProducts: {
    productId: string;
    productName: string;
    sales: number;
  }[];
}
