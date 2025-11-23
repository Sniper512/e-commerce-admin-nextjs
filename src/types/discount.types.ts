export type DiscountApplicableTo = "products" | "categories" | "order"; // What the discount applies to

export interface Discount {
  id: string;
  name: string;
  description?: string;
  value: number; // percentage value (e.g., 10 for 10%)
  createdAt: Date;

  // Status
  isActive: boolean; // Whether this discount is manually enabled/disabled

  // Applicability
  applicableTo: DiscountApplicableTo; // products, categories, or order (total)
  applicableProductIds?: string[]; // Product IDs this discount applies to (when applicableTo = 'products')
  applicableCategoryIds?: string[]; // Category IDs this discount applies to (when applicableTo = 'categories')
  minPurchaseAmount: number; // Minimum order amount to qualify (Only used when applicableTo = 'order')

  // Validity
  startDate: Date;
  endDate: Date;

  currentUsageCount: number; // Number of times the discount has been used (auto-updated)
}
