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

// Toggle batch active status
async function toggleActiveStatus(id: string): Promise<void> {
	try {
		const batch = await getBatchById(id);
		if (!batch) {
			throw new Error("Batch not found");
		}

		const newActiveStatus = !batch.isActive;
		const batchRef = doc(db, BATCHES_COLLECTION, id);
		await updateDoc(batchRef, { isActive: newActiveStatus });
	} catch (error) {
		console.error("Error toggling batch active status:", error);
		throw error;
	}
}

export { toggleActiveStatus };
