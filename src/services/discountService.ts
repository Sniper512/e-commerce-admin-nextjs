import { Discount } from "@/types";
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	getDoc,
	query,
	where,
	orderBy,
	Timestamp,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Helper function to sanitize data for Firestore (remove undefined values)
const sanitizeForFirestore = (data: any): any => {
	if (data === null || data === undefined) return null;
	if (data instanceof Date) return Timestamp.fromDate(data);
	if (Array.isArray(data)) return data.map(sanitizeForFirestore);
	if (typeof data === "object") {
		const sanitized: any = {};
		Object.keys(data).forEach((key) => {
			const value = sanitizeForFirestore(data[key]);
			if (value !== undefined) {
				sanitized[key] = value;
			}
		});
		return sanitized;
	}
	return data;
};

// Helper function to convert Firestore data to Discount
const firestoreToDiscount = (id: string, data: any): Discount => {
	// Handle timestamp conversion
	const convertTimestamp = (timestamp: any): Date => {
		if (timestamp instanceof Timestamp) {
			return timestamp.toDate();
		}
		if (timestamp instanceof Date) {
			return timestamp;
		}
		if (typeof timestamp === "string") {
			const parsed = new Date(timestamp);
			return isNaN(parsed.getTime()) ? new Date() : parsed;
		}
		// If timestamp is null, undefined, or serverTimestamp placeholder
		return new Date();
	};

	return {
		id,
		name: data.name || "",
		description: data.description || undefined,
		type: data.type || "percentage",
		value: data.value || 0,
		applicableTo: data.applicableTo || "order", // Default to order-level discount
		applicableProducts: data.applicableProducts || undefined,
		applicableCategories: data.applicableCategories || undefined,
		minPurchaseAmount: data.minPurchaseAmount || undefined,
		limitationType: data.limitationType || "unlimited",
		limitationTimes: data.limitationTimes || undefined,
		currentUsageCount: data.currentUsageCount || 0,
		adminComment: data.adminComment || undefined,
		startDate: convertTimestamp(data.startDate),
		endDate: convertTimestamp(data.endDate),
		isActive: data.isActive ?? true,
		createdAt: convertTimestamp(data.createdAt),
		updatedAt: convertTimestamp(data.updatedAt),
	};
};

// Discount Service Functions using Firebase Firestore
export class DiscountService {
	private static readonly COLLECTION_NAME = "DISCOUNTS";

	// Get all discounts
	static async getAllDiscounts(): Promise<Discount[]> {
		try {
			const discountsRef = collection(db, this.COLLECTION_NAME);
			const q = query(discountsRef, orderBy("createdAt", "desc"));
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToDiscount(doc.id, doc.data())
			);
		} catch (error) {
			console.error("Error fetching discounts:", error);
			throw error;
		}
	}

	// Get a single discount by ID
	static async getDiscountById(id: string): Promise<Discount | null> {
		try {
			const discountRef = doc(db, this.COLLECTION_NAME, id);
			const discountSnap = await getDoc(discountRef);

			if (discountSnap.exists()) {
				return firestoreToDiscount(discountSnap.id, discountSnap.data());
			}
			return null;
		} catch (error) {
			console.error(`Error fetching discount ${id}:`, error);
			throw error;
		}
	}

	// Get active discounts
	static async getActiveDiscounts(): Promise<Discount[]> {
		try {
			const discountsRef = collection(db, this.COLLECTION_NAME);
			const now = Timestamp.fromDate(new Date());
			const q = query(
				discountsRef,
				where("isActive", "==", true),
				where("startDate", "<=", now),
				where("endDate", ">=", now),
				orderBy("startDate", "desc")
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToDiscount(doc.id, doc.data())
			);
		} catch (error) {
			console.error("Error fetching active discounts:", error);
			throw error;
		}
	}

	// Get discounts by product ID
	static async getDiscountsByProductId(productId: string): Promise<Discount[]> {
		try {
			const discountsRef = collection(db, this.COLLECTION_NAME);
			const q = query(
				discountsRef,
				where("applicableProducts", "array-contains", productId),
				where("isActive", "==", true)
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToDiscount(doc.id, doc.data())
			);
		} catch (error) {
			console.error(
				`Error fetching discounts for product ${productId}:`,
				error
			);
			throw error;
		}
	}

	// Get discounts by category ID
	static async getDiscountsByCategoryId(
		categoryId: string
	): Promise<Discount[]> {
		try {
			const discountsRef = collection(db, this.COLLECTION_NAME);
			const q = query(
				discountsRef,
				where("applicableCategories", "array-contains", categoryId),
				where("isActive", "==", true)
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToDiscount(doc.id, doc.data())
			);
		} catch (error) {
			console.error(
				`Error fetching discounts for category ${categoryId}:`,
				error
			);
			throw error;
		}
	}

	// Create a new discount
	static async createDiscount(
		discountData: Omit<Discount, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		try {
			const sanitizedData = sanitizeForFirestore({
				...discountData,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});

			const discountsRef = collection(db, this.COLLECTION_NAME);
			const docRef = await addDoc(discountsRef, sanitizedData);

			return docRef.id;
		} catch (error) {
			console.error("Error creating discount:", error);
			throw error;
		}
	}

	// Update an existing discount
	static async updateDiscount(
		id: string,
		discountData: Partial<Omit<Discount, "id" | "createdAt" | "updatedAt">>
	): Promise<void> {
		try {
			const discountRef = doc(db, this.COLLECTION_NAME, id);
			const sanitizedData = sanitizeForFirestore({
				...discountData,
				updatedAt: serverTimestamp(),
			});

			await updateDoc(discountRef, sanitizedData);
		} catch (error) {
			console.error(`Error updating discount ${id}:`, error);
			throw error;
		}
	}

	// Delete a discount
	static async deleteDiscount(id: string): Promise<void> {
		try {
			const discountRef = doc(db, this.COLLECTION_NAME, id);
			await deleteDoc(discountRef);
		} catch (error) {
			console.error(`Error deleting discount ${id}:`, error);
			throw error;
		}
	}

	// Toggle discount active status
	static async toggleDiscountStatus(id: string): Promise<void> {
		try {
			const discount = await this.getDiscountById(id);
			if (!discount) {
				throw new Error(`Discount ${id} not found`);
			}

			await this.updateDiscount(id, {
				isActive: !discount.isActive,
			});
		} catch (error) {
			console.error(`Error toggling discount status ${id}:`, error);
			throw error;
		}
	}

	// Check if discount is currently valid
	static isDiscountValid(discount: Discount): boolean {
		const now = new Date();
		return (
			discount.isActive && discount.startDate <= now && discount.endDate >= now
		);
	}

	// Calculate discount amount
	static calculateDiscountAmount(
		discount: Discount,
		originalPrice: number
	): number {
		if (discount.type === "percentage") {
			return (originalPrice * discount.value) / 100;
		}
		return discount.value;
	}

	// Apply discount to price
	static applyDiscount(discount: Discount, originalPrice: number): number {
		const discountAmount = this.calculateDiscountAmount(
			discount,
			originalPrice
		);
		return Math.max(0, originalPrice - discountAmount);
	}
}
