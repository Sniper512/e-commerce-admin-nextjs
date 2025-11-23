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

// Get batch by batchId (barcode)
async function getBatchByBatchId(batchId: string): Promise<Batch | null> {
	try {
		const batchesRef = collection(db, BATCHES_COLLECTION);
		const q = query(batchesRef, where("batchId", "==", batchId));
		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			return null;
		}

		return firestoreToBatch(snapshot.docs[0].id, snapshot.docs[0].data());
	} catch (error) {
		console.error("Error fetching batch by batchId:", error);
		throw error;
	}
}
export { getBatchByBatchId };
