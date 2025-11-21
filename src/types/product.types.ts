// Product Types

// Product Information Section
export interface ProductInfo {
  name: string;
  nameLower: string; // Lowercase version for case-insensitive search
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

export interface Product {
  id: string;
  slug: string;

  // Product Information Section
  info: ProductInfo;

  // Pricing
  price: number; // Current selling price (highest of all the batches, synced from batches)

  // Discounts Section
  discountIds: string[]; // Array of associated discount IDs
  featuredDiscountIds: string[]; // Array of discount IDs that should be featured on homepage for this product

  // Inventory Section
  minimumStockQuantity: number;

  // Multimedia Section
  multimedia: ProductMultimedia;

  // Similar Products Section
  similarProductIds: string[];

  // Bought together Section
  boughtTogetherProductIds: string[];

  // Purchase History Section
  purchaseHistory: PurchaseOrderHistory[];

  // Batch Stock Data (calculated from batches)
  batchStock?: {
    usableStock: number; // Non-expired stock
    expiredStock: number; // Expired stock
    totalStock: number; // Total stock (usable + expired)
    activeBatchCount: number; // Number of active batches
  };
}
