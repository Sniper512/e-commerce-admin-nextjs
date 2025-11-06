// Product Types

// Product Information Section
export interface ProductInfo {
  name: string;
  description: string;
  categoryIds: string[]; // Format: "categoryId" or "parentCategoryId/subCategoryId"
  manufacturerId: string; // Reference to manufacturer ID
  isActive: boolean;
  productTags: string[];
  allowCustomerReviews: boolean;
  markAsNew: boolean;
  markAsNewStartDate?: Date;
  markAsNewEndDate?: Date;
}

// Inventory Section
export interface ProductInventory {
  stockQuantity: number;
  minimumStockQuantity: number;
}

// Multimedia Section
export interface ProductMultimedia {
  images: string[];
  video: string;
}

// Purchase History Section
export interface PurchaseOrderHistory {
  orderId: string;
  orderDate: Date;
  customerName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// Stock History Section
export interface StockQuantityHistory {
  id: string;
  date: Date;
  previousQuantity: number;
  newQuantity: number;
  changeReason: "sale" | "restock" | "adjustment" | "return" | "damage";
  notes?: string;
  userId: string; // Who made the change
  orderId?: string; // If related to an order
}

export interface Product {
  id: string;
  slug: string;

  // Product Information Section
  info: ProductInfo;

  // Discounts Section
  discountIds: string[]; // Array of associated discount IDs

  // Inventory Section
  inventory: ProductInventory;

  // Multimedia Section
  multimedia: ProductMultimedia;

  // Similar Products Section
  similarProductIds: string[];

  // Bought together Section
  boughtTogetherProductIds: string[];

  // Purchase History Section
  purchaseHistory: PurchaseOrderHistory[];

  // Stock History Section
  stockHistory: StockQuantityHistory[];

  // Batch tracking (existing functionality)
  hasBatches: boolean;

  // Display
  displayOrder: number;
}
