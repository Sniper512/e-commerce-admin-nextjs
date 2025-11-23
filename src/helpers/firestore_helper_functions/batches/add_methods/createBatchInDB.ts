import { db } from "@/../firebaseConfig";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	addDoc,
} from "firebase/firestore";
import { Batch } from "@/types";
import { updateProductPrice } from "../../products/updateProductPrice";
import { sanitizeForFirestore } from "@/lib/firestore-utils";


const BATCHES_COLLECTION = "BATCHES";

// Create batch
async function createBatch(batchData: Omit<Batch, "id">): Promise<void> {
	try {
		const batchesRef = collection(db, BATCHES_COLLECTION);

		// Sanitize data (converts Date to Timestamp automatically)
		const sanitizedData = sanitizeForFirestore({
			batchId: batchData.batchId,
			productId: batchData.productId,
			manufacturingDate: batchData.manufacturingDate, // Will be converted to Timestamp
			expiryDate: batchData.expiryDate, // Will be converted to Timestamp
			quantity: batchData.quantity,
			remainingQuantity: batchData.remainingQuantity,
			price: batchData.price, // Include price
			supplier: batchData.supplier,
			location: batchData.location,
			notes: batchData.notes,
			isActive: batchData.isActive !== undefined ? batchData.isActive : true,
			createdAt: batchData.createdAt || new Date(),
		});

		await addDoc(batchesRef, sanitizedData);

		// Update product price (sets to highest batch price or first batch price)
		await updateProductPrice(batchData.productId);

		return;
	} catch (error) {
		console.error("Error creating batch:", error);
		throw error;
	}
}

export { createBatch };