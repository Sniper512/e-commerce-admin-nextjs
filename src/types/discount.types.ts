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
  // Note: Product associations are stored in Product.discountIds
  // Note: Category associations are stored in Category.discountIds
  minPurchaseAmount?: number; // Minimum order amount to qualify (Only used when applicableTo = 'order')

  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;

  currentUsageCount: number; // Number of times the discount has been used (auto-updated)
}
