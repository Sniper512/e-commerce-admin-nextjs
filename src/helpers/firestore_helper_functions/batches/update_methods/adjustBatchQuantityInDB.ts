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
import { getBatchById } from "../get_methods/getBatchByIdFromDB";

const BATCHES_COLLECTION = "BATCHES";

// Adjust batch quantity (when products are sold)
async function adjustBatchQuantity(
	id: string,
	quantityChange: number
): Promise<void> {
	try {
		const batch = await getBatchById(id);
		if (!batch) {
			throw new Error("Batch not found");
		}

		const newQuantity = batch.remainingQuantity + quantityChange;
		if (newQuantity < 0) {
			throw new Error("Insufficient quantity in batch");
		}
		const batchRef = doc(db, BATCHES_COLLECTION, id);
		await updateDoc(batchRef, {
			remainingQuantity: newQuantity,
		});
	} catch (error) {
		console.error("Error adjusting batch quantity:", error);
		throw error;
	}
}

export { adjustBatchQuantity };
