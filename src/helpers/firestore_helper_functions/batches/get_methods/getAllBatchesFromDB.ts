import { firestoreToBatch } from "../firestoreDocumentToBatchConverter";
import { db } from "../../../../../firebaseConfig";
import {
	collection,
	where,
	query,
	doc,
	updateDoc,
	getDocs,
	orderBy,
} from "firebase/firestore";
import { Batch } from "@/types/batch.types";

const BATCHES_COLLECTION = "BATCHES";

// Get all batches
export async function getAllBatches(): Promise<Batch[]> {
	try {
		const batchesRef = collection(db, BATCHES_COLLECTION);
		const q = query(batchesRef, orderBy("expiryDate", "desc"));
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => firestoreToBatch(doc.id, doc.data()));
	} catch (error) {
		console.error("Error fetching batches:", error);
		throw error;
	}
}
