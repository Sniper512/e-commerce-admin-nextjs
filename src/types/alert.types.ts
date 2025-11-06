// Alert Types
export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStockLevel: number;
  status: "active" | "resolved";
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ExpiryAlert {
  id: string;
  productId: string;
  productName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: Date;
  daysUntilExpiry: number;
  quantity: number;
  status: "active" | "resolved";
  createdAt: Date;
  resolvedAt?: Date;
}
