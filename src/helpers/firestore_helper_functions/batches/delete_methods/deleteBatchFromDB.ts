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

// Delete batch
async function deleteBatch(id: string): Promise<void> {
	try {
		// Get the batch to know which product it belongs to
		const batch = await getBatchById(id);
		if (!batch) {
			throw new Error("Batch not found");
		}

		const batchRef = doc(db, BATCHES_COLLECTION, id);
		await deleteDoc(batchRef);
	} catch (error) {
		console.error("Error deleting batch:", error);
		throw error;
	}
}

export { deleteBatch };
