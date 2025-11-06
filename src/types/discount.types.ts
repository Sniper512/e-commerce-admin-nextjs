// Discount Types
export type DiscountType = "percentage" | "fixed";
export type DiscountApplicableTo = "products" | "categories" | "order"; // What the discount applies to
export type DiscountLimitationType =
  | "unlimited"
  | "n_times_only"
  | "n_times_per_customer";

export interface Discount {
  id: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number; // percentage or fixed amount

  // Applicability
  applicableTo: DiscountApplicableTo; // products, categories, or order (total)
  applicableProducts?: string[]; // Only used when applicableTo = 'products'
  applicableCategories?: string[]; // Only used when applicableTo = 'categories'
  minPurchaseAmount?: number; // Minimum order amount to qualify

  // Limitation
  limitationType: DiscountLimitationType; // unlimited, n_times_only, or n_times_per_customer
  limitationTimes?: number; // Only used when limitationType is not 'unlimited'
  currentUsageCount?: number; // Track how many times discount has been used

  // Admin comment
  adminComment?: string;

  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// Enhanced Discount Types (for separate discount management page)
export interface EnhancedDiscount {
  id: string;
  name: string;
  description: string;
  type: "percentage" | "fixed_amount";
  value: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  applicableProducts: string[]; // Product IDs
  applicableCategories: string[]; // Category IDs
  minimumOrderAmount?: number;
  maximumDiscountAmount?: number;
  customerRoleIds: string[]; // Which customer roles can use this
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Promo Code Types
export type PromoCodeType = "single_use" | "multi_use";

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  type: PromoCodeType;
  discountType: DiscountType;
  discountValue: number;

  // Usage limits
  maxUses?: number;
  usedCount: number;
  maxUsesPerCustomer?: number;

  // Validity
  startDate: Date;
  endDate: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
