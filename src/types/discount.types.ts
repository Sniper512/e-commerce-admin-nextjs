export type DiscountType = "percentage" | "fixed";
export type DiscountApplicableTo = "products" | "categories" | "order"; // What the discount applies to

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // percentage or fixed amount

  // Applicability
  applicableTo: DiscountApplicableTo; // products, categories, or order (total)
  applicableProductIds?: string[]; // Only used when applicableTo = 'products'
  applicableCategoryIds?: string[]; // Only used when applicableTo = 'categories'
  minPurchaseAmount?: number; // Minimum order amount to qualify (Only used when applicableTo = 'order')

  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;

  currentUsageCount: number; // Number of times the discount has been used (auto-updated)
}
