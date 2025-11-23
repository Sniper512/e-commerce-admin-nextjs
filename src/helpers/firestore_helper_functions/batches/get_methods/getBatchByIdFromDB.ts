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
import { firestoreToBatch } from "@/helpers/firestore_helper_functions/batches/firestoreDocumentToBatchConverter";

const BATCHES_COLLECTION = "BATCHES";
// Get batch by ID
export async function getBatchById(id: string): Promise<Batch | null> {
	try {
		const batchRef = doc(db, BATCHES_COLLECTION, id);
		const batchDoc = await getDoc(batchRef);

		if (!batchDoc.exists()) {
			return null;
		}

		return firestoreToBatch(batchDoc.id, batchDoc.data());
	} catch (error) {
		console.error("Error fetching batch:", error);
		throw error;
	}
}
