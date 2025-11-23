// Manufacturer Types
export interface Manufacturer {
  id: string;
  name: string;
  description?: string;
  logo?: string; // Logo/image URL
  displayOrder: number;
  isActive: boolean;
  productCount?: number; // Computed count of products
  createdAt: Date;
}
