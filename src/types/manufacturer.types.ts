// Manufacturer Types
export interface Manufacturer {
  id: string;
  name: string;
  description?: string;
  logo?: string; // Logo/image URL
  displayOrder: number;
  productCount?: number; // Computed count of products
}
