import { firestoreToBatch } from "../batches/firestoreDocumentToBatchConverter";
import { db } from "../../../../firebaseConfig";
import {
	collection,
	where,
	query,
	doc,
	updateDoc,
	getDocs,
} from "firebase/firestore";

// Helper function to update product price based on batches
export async function updateProductPrice(productId: string): Promise<void> {
	try {
		// Get all batches for this product
		const batchesRef = collection(db, "BATCHES");
		const q = query(batchesRef, where("productId", "==", productId));
		const snapshot = await getDocs(q);

		if (snapshot.empty) {
			// No batches, set price to 0
			const productRef = doc(db, "PRODUCTS", productId);
			await updateDoc(productRef, { price: 0 });
			return;
		}

		// Get the highest price from all batches
		const batches = snapshot.docs.map((doc) =>
			firestoreToBatch(doc.id, doc.data())
		);
		const highestPrice = Math.max(...batches.map((batch) => batch.price || 0));

		// Update product price
		const productRef = doc(db, "PRODUCTS", productId);
		await updateDoc(productRef, { price: highestPrice });
	} catch (error) {
		console.error("Error updating product price:", error);
		throw error;
	}
}
