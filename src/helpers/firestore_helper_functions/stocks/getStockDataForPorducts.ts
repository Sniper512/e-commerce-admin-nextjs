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
import { firestoreToBatch } from "../batches/firestoreDocumentToBatchConverter";

const BATCHES_COLLECTION = "BATCHES";

// Get stock data for multiple products
async function getStockDataForProducts(productIds: string[]): Promise<
	Record<
		string,
		{
			usableStock: number;
			expiredStock: number;
			totalStock: number;
			activeBatchCount: number;
		}
	>
> {
	try {
		if (productIds.length === 0) {
			return {};
		}

		const batchesRef = collection(db, BATCHES_COLLECTION);
		const q = query(batchesRef, where("productId", "in", productIds));
		const snapshot = await getDocs(q);

		const stockMap = new Map<
			string,
			{
				usableStock: number;
				totalStock: number;
				expiredStock: number;
				batchCount: number;
			}
		>();

		// Initialize map with zeros for all product IDs
		productIds.forEach((productId) => {
			stockMap.set(productId, {
				usableStock: 0,
				totalStock: 0,
				expiredStock: 0,
				batchCount: 0,
			});
		});

		const now = new Date();

		// Process all batches
		snapshot.docs.forEach((doc) => {
			const batch = firestoreToBatch(doc.id, doc.data());
			const productId = batch.productId;
			const stockData = stockMap.get(productId);

			if (!stockData) return;

			const expiryDate = new Date(batch.expiryDate);
			const isExpired = expiryDate < now;

			// Add to total stock
			stockData.totalStock += batch.remainingQuantity;
			stockData.batchCount += 1;

			// Categorize as usable or expired
			if (isExpired) {
				stockData.expiredStock += batch.remainingQuantity;
			} else {
				stockData.usableStock += batch.remainingQuantity;
			}
		});

		// Convert Map to Record
		const result: Record<
			string,
			{
				usableStock: number;
				expiredStock: number;
				totalStock: number;
				activeBatchCount: number;
			}
		> = {};

		stockMap.forEach((value, key) => {
			result[key] = {
				usableStock: value.usableStock,
				expiredStock: value.expiredStock,
				totalStock: value.totalStock,
				activeBatchCount: value.batchCount,
			};
		});

		return result;
	} catch (error) {
		console.error("Error fetching stock data for products:", error);
		throw error;
	}
}
export { getStockDataForProducts };