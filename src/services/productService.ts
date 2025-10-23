import {
	collection,
	doc,
	getDocs,
	getDoc,
	addDoc,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	Timestamp,
	QueryConstraint,
} from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { Product, ProductBatch, Carton } from "@/types";

const PRODUCTS_COLLECTION = "PRODUCTS";
const BATCHES_COLLECTION = "BATCHES";
const CARTONS_COLLECTION = "CARTONS";

// Helper: sanitize object for Firestore by removing undefined values
// and converting Date instances to Firestore Timestamps recursively.
function sanitizeForFirestore(value: any): any {
	if (value === undefined) return undefined; // caller can skip
	if (value === null) return null;
	if (value instanceof Date) return Timestamp.fromDate(value);
	if (Array.isArray(value)) {
		// map and filter out undefined entries
		const arr = value
			.map((v) => sanitizeForFirestore(v))
			.filter((v) => v !== undefined);
		return arr;
	}
	if (typeof value === "object") {
		const out: any = {};
		for (const k of Object.keys(value)) {
			const v = sanitizeForFirestore(value[k]);
			if (v !== undefined) out[k] = v;
		}
		return out;
	}
	return value; // primitive (number, string, boolean)
}

// Product Services
export const productService = {
	// Get all products
	async getAll(filters?: {
		categoryId?: string;
		type?: "single" | "composite";
		isActive?: boolean;
	}): Promise<Product[]> {
		const constraints: QueryConstraint[] = [];

		if (filters?.categoryId) {
			constraints.push(
				where("categoryIds", "array-contains", filters.categoryId)
			);
		}
		if (filters?.type) {
			constraints.push(where("type", "==", filters.type));
		}
		if (filters?.isActive !== undefined) {
			constraints.push(where("isActive", "==", filters.isActive));
		}

		constraints.push(orderBy("displayOrder", "asc"));

		const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as Product[];
	},

	// Get product by ID
	async getById(id: string): Promise<Product | null> {
		const docRef = doc(db, PRODUCTS_COLLECTION, id);
		const docSnap = await getDoc(docRef);

		if (!docSnap.exists()) return null;

		return {
			id: docSnap.id,
			...docSnap.data(),
			createdAt: docSnap.data().createdAt?.toDate(),
			updatedAt: docSnap.data().updatedAt?.toDate(),
		} as Product;
	},

	// Create product
	async create(
		data: Omit<Product, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		// sanitize input to remove undefined and convert Dates
		const payload = sanitizeForFirestore(data);
		const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
			...payload,
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});
		return docRef.id;
	},

	// Update product
	async update(id: string, data: Partial<Product>): Promise<void> {
		const docRef = doc(db, PRODUCTS_COLLECTION, id);
		// sanitize update payload (remove undefined values and convert Dates)
		let updateDataAny: any = sanitizeForFirestore(data);
		if (updateDataAny === undefined) updateDataAny = {};
		await updateDoc(docRef, {
			...updateDataAny,
			updatedAt: Timestamp.now(),
		});
	},

	// Delete product
	async delete(id: string): Promise<void> {
		const docRef = doc(db, PRODUCTS_COLLECTION, id);
		await deleteDoc(docRef);
	},

	// Get low stock products
	async getLowStock(): Promise<Product[]> {
		const products = await this.getAll();
		return products.filter(
			(p) => p.inventory.stockQuantity <= p.inventory.minimumStockQuantity
		);
	},

	// Update stock quantity
	async updateStock(id: string, quantity: number): Promise<void> {
		const docRef = doc(db, PRODUCTS_COLLECTION, id);
		await updateDoc(docRef, {
			"inventory.stockQuantity": quantity,
			updatedAt: Timestamp.now(),
		});
	},
};

// Batch Services
export const batchService = {
	// Get all batches
	async getAll(productId?: string): Promise<ProductBatch[]> {
		const constraints: QueryConstraint[] = [];

		if (productId) {
			constraints.push(where("productId", "==", productId));
		}

		constraints.push(orderBy("expiryDate", "asc"));

		const q = query(collection(db, BATCHES_COLLECTION), ...constraints);
		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			manufacturingDate: doc.data().manufacturingDate?.toDate(),
			expiryDate: doc.data().expiryDate?.toDate(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as ProductBatch[];
	},

	// Get expiring soon batches
	async getExpiringSoon(daysThreshold: number = 30): Promise<ProductBatch[]> {
		const thresholdDate = new Date();
		thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

		const q = query(
			collection(db, BATCHES_COLLECTION),
			where("expiryDate", "<=", Timestamp.fromDate(thresholdDate)),
			orderBy("expiryDate", "asc")
		);

		const snapshot = await getDocs(q);

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...doc.data(),
			manufacturingDate: doc.data().manufacturingDate?.toDate(),
			expiryDate: doc.data().expiryDate?.toDate(),
			createdAt: doc.data().createdAt?.toDate(),
			updatedAt: doc.data().updatedAt?.toDate(),
		})) as ProductBatch[];
	},

	// Create batch
	async create(
		data: Omit<ProductBatch, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		const docRef = await addDoc(collection(db, BATCHES_COLLECTION), {
			...data,
			manufacturingDate: Timestamp.fromDate(data.manufacturingDate),
			expiryDate: Timestamp.fromDate(data.expiryDate),
			createdAt: Timestamp.now(),
			updatedAt: Timestamp.now(),
		});
		return docRef.id;
	},

	// Update batch
	async update(id: string, data: Partial<ProductBatch>): Promise<void> {
		const docRef = doc(db, BATCHES_COLLECTION, id);
		const updateData: any = {
			...data,
			updatedAt: Timestamp.now(),
		};

		if (data.manufacturingDate) {
			updateData.manufacturingDate = Timestamp.fromDate(data.manufacturingDate);
		}
		if (data.expiryDate) {
			updateData.expiryDate = Timestamp.fromDate(data.expiryDate);
		}

		await updateDoc(docRef, updateData);
	},

	// Delete batch
	async delete(id: string): Promise<void> {
		const docRef = doc(db, BATCHES_COLLECTION, id);
		await deleteDoc(docRef);
	},
};
