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

// Get batches by product ID
async function getBatchesByProductId(productId: string): Promise<Batch[]> {
	try {
		const batchesRef = collection(db, BATCHES_COLLECTION);
		const q = query(
			batchesRef,
			where("productId", "==", productId),
			orderBy("expiryDate", "asc")
		);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => firestoreToBatch(doc.id, doc.data()));
	} catch (error) {
		console.error("Error fetching batches by product:", error);
		throw error;
	}
}

export { getBatchesByProductId };
