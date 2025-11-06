// Marketing Types (Banner, Notification, Review)

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
