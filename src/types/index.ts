// Core Types for E-commerce Admin Dashboard

export type UserRole = "admin" | "manager" | "staff";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export type CategoryType = "simple" | "special";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: CategoryType; // simple or special (e.g., "Summer Sales")
  displayOrder: number;
  picture?: string; // Category image/picture URL
  subCategoryCount: number; // Count of subcategories
  isPublished: boolean; // Whether category is published
  productIds: string[]; // Array of product IDs in this category
  productCount?: number; // Computed count of products
  showOnHomepage: boolean;
  showOnNavbar: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// SubCategory interface for two-level hierarchy
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  picture?: string;
  parentCategoryId: string; // Reference to parent category
  isPublished: boolean;
  productIds: string[];
  productCount?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Product Information Section
export interface ProductInfo {
  name: string;
  description: string;
  categories: string[]; // Array of category IDs
  manufacturer: string;
  isPublished: boolean;
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
  images: ProductImage[];
  videos: ProductVideo[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVideo {
  id: string;
  url: string;
  title: string;
  description?: string;
  sortOrder: number;
}

// Related Products Section
export interface RelatedProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
}

// Bought together Section
export interface BoughtTogetherProduct {
  productId: string;
  productName: string;
  imageUrl?: string;
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

  // Related Products Section
  similarProducts: RelatedProduct[];

  // Bought together Section
  boughtTogetherProducts: BoughtTogetherProduct[];

  // Purchase History Section
  purchaseHistory: PurchaseOrderHistory[];

  // Stock History Section
  stockHistory: StockQuantityHistory[];

  // Legacy fields for backwards compatibility
  categoryIds: string[]; // Alias for info.categories
  images: string[]; // Alias for multimedia.images URLs
  thumbnailUrl?: string;
  minStockLevel: number; // Alias for inventory.minimumStockQuantity
  basePrice: number; // Alias for pricing.productCost
  sellingPrice: number; // Alias for pricing.price

  // Composite product details
  compositeItems?: {
    productId: string;
    quantity: number;
  }[];

  // Batch tracking (existing functionality)
  hasBatches: boolean;

  // Display
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean; // Alias for info.isPublished

  // Metadata
  tags?: string[]; // Alias for info.productTags
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
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

// Batch Management (for products with expiry dates)
export interface ProductBatch {
  id: string;
  productId: string;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  costPrice: number;
  supplierId?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Customer Types
export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Customer metrics
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;

  // Preferences
  fcmToken?: string; // For push notifications
  notificationsEnabled: boolean;

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

// Ledger & Expense Management
export type ExpenseCategory =
  | "rent"
  | "salaries"
  | "utilities"
  | "inventory"
  | "marketing"
  | "transportation"
  | "maintenance"
  | "other";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  reference?: string;
  attachments?: string[];
  addedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Promotion & Discount Types
export type DiscountType = "percentage" | "fixed";
export type DiscountApplicableTo = "products" | "categories" | "order"; // What the discount applies to
export type DiscountLimitationType =
  | "unlimited"
  | "n_times_only"
  | "n_times_per_customer";
export type PromoCodeType = "single_use" | "multi_use";

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

  createdAt: Date;
  updatedAt: Date;
}

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

// Banner Management
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  displayOrder: number;

  // Placement
  placement:
    | "homepage_main"
    | "homepage_secondary"
    | "category_page"
    | "product_page";

  // Validity
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

// Review & Feedback
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  productId: string;
  customerId: string;
  orderId?: string;
  rating: number; // 1-5
  title?: string;
  comment: string;
  images?: string[];
  status: ReviewStatus;
  moderatedBy?: string;
  moderationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType =
  | "order_update"
  | "promotion"
  | "reminder"
  | "announcement"
  | "low_stock"
  | "expiry_alert";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;

  // Targeting
  targetCustomers?: string[]; // specific customer IDs
  targetAll?: boolean;

  // Status
  sentAt?: Date;
  status: "draft" | "scheduled" | "sent";
  scheduledFor?: Date;

  // Metadata
  actionUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

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

// Analytics & Reports
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

// Batch Types
export type BatchStatus = "active" | "expired" | "recalled";

export interface Batch {
  id: string;
  batchId: string; // Barcode/unique identifier
  productId: string;
  productName?: string; // Populated from product
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  remainingQuantity: number;
  supplier?: string;
  location?: string; // Storage location
  notes?: string;
  status: BatchStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
