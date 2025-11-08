// Customer Types
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;

  // Customer metrics
  totalOrders: number;
  totalSpent: number;

  // Preferences
  notificationsEnabled: boolean;
  isActive: boolean;
}

export interface CustomerSearchResult {
  id: string;
  name: string;
  phone: string;
  address?: string;
}
