import { Batch } from "@/types";
import { convertTimestamp } from "@/lib/firestore-utils";
// Helper to convert Firestore timestamp to Date
export const firestoreToBatch = (id: string, data: any): Batch => {
	return {
		id,
		batchId: data.batchId || "",
		productId: data.productId || "",
		manufacturingDate: convertTimestamp(data.manufacturingDate),
		expiryDate: convertTimestamp(data.expiryDate),
		quantity: data.quantity || 0,
		remainingQuantity: data.remainingQuantity ?? data.quantity ?? 0,
		price: data.price || 0,
		supplier: data.supplier,
		location: data.location,
		notes: data.notes,
		isActive: data.isActive !== undefined ? data.isActive : true,
		createdAt: data.createdAt ? convertTimestamp(data.createdAt) : new Date(),
	};
};
