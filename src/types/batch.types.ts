// Batch Types
export interface Batch {
  id: string;
  batchId: string; // Barcode/unique identifier
  productId: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  remainingQuantity: number;
  price: number; // Price per unit for this batch
  supplier?: string;
  location?: string; // Storage location
  notes?: string;
  isActive: boolean;
  createdAt: Date;
}
