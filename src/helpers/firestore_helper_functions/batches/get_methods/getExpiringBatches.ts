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

// Get expiring batches
async function getExpiringBatches(
	daysThreshold: number = 30
): Promise<Batch[]> {
	try {
		const now = new Date();
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

		const batchesRef = collection(db, BATCHES_COLLECTION);
		const q = query(batchesRef, orderBy("expiryDate", "asc"));
		const snapshot = await getDocs(q);

		const batches = snapshot.docs.map((doc) =>
			firestoreToBatch(doc.id, doc.data())
		);

		// Filter batches expiring within threshold (not yet expired, but expiring soon)
		return batches.filter((batch) => {
			const expiryDate = new Date(batch.expiryDate);
			return expiryDate <= thresholdDate && expiryDate >= now;
		});
	} catch (error) {
		console.error("Error fetching expiring batches:", error);
		throw error;
	}
}
