// Batch Types
export type BatchStatus = "active" | "expired";

export interface Batch {
  id: string;
  batchId: string; // Barcode/unique identifier
  productId: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  remainingQuantity: number;
  supplier?: string;
  location?: string; // Storage location
  notes?: string;
  status: BatchStatus;
}
