import { db } from "@/../firebaseConfig";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	serverTimestamp,
	Timestamp,
} from "firebase/firestore";
import { Batch, BatchStatus } from "@/types";

const BATCHES_COLLECTION = "batches";

// Helper to convert Firestore timestamp to Date
const firestoreToBatch = (id: string, data: any): Batch => {
	return {
		id,
		batchId: data.batchId || "",
		productId: data.productId || "",
		productName: data.productName,
		manufacturingDate: data.manufacturingDate?.toDate() || new Date(),
		expiryDate: data.expiryDate?.toDate() || new Date(),
		quantity: data.quantity || 0,
		remainingQuantity: data.remainingQuantity ?? data.quantity ?? 0,
		supplier: data.supplier,
		location: data.location,
		notes: data.notes,
		status: data.status || "active",
		createdAt: data.createdAt?.toDate() || new Date(),
		updatedAt: data.updatedAt?.toDate() || new Date(),
		createdBy: data.createdBy,
		updatedBy: data.updatedBy,
	};
};

// Helper to sanitize data for Firestore
const sanitizeForFirestore = (data: any) => {
	const sanitized: any = { ...data };

	// Remove undefined values
	Object.keys(sanitized).forEach((key) => {
		if (sanitized[key] === undefined) {
			delete sanitized[key];
		}
	});

	return sanitized;
};

export const batchService = {
	// Get all batches
	async getAllBatches(): Promise<Batch[]> {
		try {
			const batchesRef = collection(db, BATCHES_COLLECTION);
			const q = query(batchesRef, orderBy("createdAt", "desc"));
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) => firestoreToBatch(doc.id, doc.data()));
		} catch (error) {
			console.error("Error fetching batches:", error);
			throw error;
		}
	},

	// Get batch by ID
	async getBatchById(id: string): Promise<Batch | null> {
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
	},

	// Get batch by batchId (barcode)
	async getBatchByBatchId(batchId: string): Promise<Batch | null> {
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
	},

	// Get batches by product ID
	async getBatchesByProductId(productId: string): Promise<Batch[]> {
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
	},

	// Get expiring batches
	async getExpiringBatches(daysThreshold: number = 30): Promise<Batch[]> {
		try {
			const thresholdDate = new Date();
			thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

			const batchesRef = collection(db, BATCHES_COLLECTION);
			const q = query(
				batchesRef,
				where("status", "==", "active"),
				orderBy("expiryDate", "asc")
			);
			const snapshot = await getDocs(q);

			const batches = snapshot.docs.map((doc) =>
				firestoreToBatch(doc.id, doc.data())
			);

			// Filter batches expiring within threshold
			return batches.filter((batch) => {
				const expiryDate = new Date(batch.expiryDate);
				return expiryDate <= thresholdDate && expiryDate >= new Date();
			});
		} catch (error) {
			console.error("Error fetching expiring batches:", error);
			throw error;
		}
	},

	// Create batch
	async createBatch(
		batchData: Omit<Batch, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		try {
			const batchesRef = collection(db, BATCHES_COLLECTION);

			const data = sanitizeForFirestore({
				batchId: batchData.batchId,
				productId: batchData.productId,
				productName: batchData.productName,
				manufacturingDate: Timestamp.fromDate(batchData.manufacturingDate),
				expiryDate: Timestamp.fromDate(batchData.expiryDate),
				quantity: batchData.quantity,
				remainingQuantity: batchData.remainingQuantity,
				supplier: batchData.supplier,
				location: batchData.location,
				notes: batchData.notes,
				status: batchData.status || "active",
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
				createdBy: batchData.createdBy,
			});

			const docRef = await addDoc(batchesRef, data);
			return docRef.id;
		} catch (error) {
			console.error("Error creating batch:", error);
			throw error;
		}
	},

	// Update batch
	async updateBatch(id: string, batchData: Partial<Batch>): Promise<void> {
		try {
			const batchRef = doc(db, BATCHES_COLLECTION, id);

			const data: any = {
				updatedAt: serverTimestamp(),
			};

			if (batchData.batchId !== undefined) data.batchId = batchData.batchId;
			if (batchData.productId !== undefined)
				data.productId = batchData.productId;
			if (batchData.productName !== undefined)
				data.productName = batchData.productName;
			if (batchData.manufacturingDate !== undefined) {
				data.manufacturingDate = Timestamp.fromDate(
					batchData.manufacturingDate
				);
			}
			if (batchData.expiryDate !== undefined) {
				data.expiryDate = Timestamp.fromDate(batchData.expiryDate);
			}
			if (batchData.quantity !== undefined) data.quantity = batchData.quantity;
			if (batchData.remainingQuantity !== undefined) {
				data.remainingQuantity = batchData.remainingQuantity;
			}
			if (batchData.supplier !== undefined) data.supplier = batchData.supplier;
			if (batchData.location !== undefined) data.location = batchData.location;
			if (batchData.notes !== undefined) data.notes = batchData.notes;
			if (batchData.status !== undefined) data.status = batchData.status;
			if (batchData.updatedBy !== undefined)
				data.updatedBy = batchData.updatedBy;

			await updateDoc(batchRef, sanitizeForFirestore(data));
		} catch (error) {
			console.error("Error updating batch:", error);
			throw error;
		}
	},

	// Delete batch
	async deleteBatch(id: string): Promise<void> {
		try {
			const batchRef = doc(db, BATCHES_COLLECTION, id);
			await deleteDoc(batchRef);
		} catch (error) {
			console.error("Error deleting batch:", error);
			throw error;
		}
	},

	// Update batch status
	async updateBatchStatus(id: string, status: BatchStatus): Promise<void> {
		try {
			const batchRef = doc(db, BATCHES_COLLECTION, id);
			await updateDoc(batchRef, {
				status,
				updatedAt: serverTimestamp(),
			});
		} catch (error) {
			console.error("Error updating batch status:", error);
			throw error;
		}
	},

	// Adjust batch quantity (when products are sold)
	async adjustBatchQuantity(id: string, quantityChange: number): Promise<void> {
		try {
			const batch = await this.getBatchById(id);
			if (!batch) {
				throw new Error("Batch not found");
			}

			const newQuantity = batch.remainingQuantity + quantityChange;
			if (newQuantity < 0) {
				throw new Error("Insufficient quantity in batch");
			}

			await this.updateBatch(id, {
				remainingQuantity: newQuantity,
			});
		} catch (error) {
			console.error("Error adjusting batch quantity:", error);
			throw error;
		}
	},
};

export default batchService;
