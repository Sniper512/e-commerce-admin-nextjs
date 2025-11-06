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
