import { Carton, CartonProductItem } from "@/types";
import {
	collection,
	addDoc,
	updateDoc,
	deleteDoc,
	doc,
	getDocs,
	getDoc,
	query,
	orderBy,
	where,
	Timestamp,
	serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

// Helper function to sanitize data for Firestore
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

// Helper function to convert Firestore data to Carton
const firestoreToCarton = (id: string, data: any): Carton => {
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
		return new Date();
	};

	return {
		id,
		cartonNumber: data.cartonNumber || "",
		name: data.name || "",
		description: data.description || undefined,
		products: data.products || [],
		totalQuantity: data.totalQuantity || 0,
		totalCost: data.totalCost || 0,
		status: data.status || "active",
		supplier: data.supplier || undefined,
		purchaseDate: data.purchaseDate
			? convertTimestamp(data.purchaseDate)
			: undefined,
		notes: data.notes || undefined,
		createdAt: convertTimestamp(data.createdAt),
		updatedAt: convertTimestamp(data.updatedAt),
		createdBy: data.createdBy || undefined,
		updatedBy: data.updatedBy || undefined,
	};
};

// Carton Service Functions
export class CartonService {
	private static readonly COLLECTION_NAME = "CARTONS";

	// Get all cartons
	static async getAllCartons(): Promise<Carton[]> {
		try {
			const cartonsRef = collection(db, this.COLLECTION_NAME);
			const q = query(cartonsRef, orderBy("createdAt", "desc"));
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) => firestoreToCarton(doc.id, doc.data()));
		} catch (error) {
			console.error("Error fetching cartons:", error);
			throw error;
		}
	}

	// Get carton by ID
	static async getCartonById(id: string): Promise<Carton | null> {
		try {
			const docRef = doc(db, this.COLLECTION_NAME, id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return firestoreToCarton(docSnap.id, docSnap.data());
			}
			return null;
		} catch (error) {
			console.error(`Error fetching carton ${id}:`, error);
			throw error;
		}
	}

	// Get cartons by status
	static async getCartonsByStatus(
		status: "active" | "archived" | "shipped"
	): Promise<Carton[]> {
		try {
			const cartonsRef = collection(db, this.COLLECTION_NAME);
			const q = query(
				cartonsRef,
				where("status", "==", status),
				orderBy("createdAt", "desc")
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) => firestoreToCarton(doc.id, doc.data()));
		} catch (error) {
			console.error(`Error fetching cartons with status ${status}:`, error);
			throw error;
		}
	}

	// Create new carton
	static async createCarton(
		cartonData: Omit<Carton, "id" | "createdAt" | "updatedAt">
	): Promise<string> {
		try {
			const sanitizedData = sanitizeForFirestore({
				...cartonData,
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});

			const cartonsRef = collection(db, this.COLLECTION_NAME);
			const docRef = await addDoc(cartonsRef, sanitizedData);

			return docRef.id;
		} catch (error) {
			console.error("Error creating carton:", error);
			throw error;
		}
	}

	// Update carton
	static async updateCarton(
		id: string,
		updates: Partial<Omit<Carton, "id" | "createdAt" | "updatedAt">>
	): Promise<void> {
		try {
			const cartonRef = doc(db, this.COLLECTION_NAME, id);
			const sanitizedData = sanitizeForFirestore({
				...updates,
				updatedAt: serverTimestamp(),
			});

			await updateDoc(cartonRef, sanitizedData);
		} catch (error) {
			console.error(`Error updating carton ${id}:`, error);
			throw error;
		}
	}

	// Delete carton
	static async deleteCarton(id: string): Promise<void> {
		try {
			const cartonRef = doc(db, this.COLLECTION_NAME, id);
			await deleteDoc(cartonRef);
		} catch (error) {
			console.error(`Error deleting carton ${id}:`, error);
			throw error;
		}
	}

	// Generate unique carton number
	static async generateCartonNumber(): Promise<string> {
		try {
			const cartonsRef = collection(db, this.COLLECTION_NAME);
			const snapshot = await getDocs(cartonsRef);
			const count = snapshot.size + 1;
			const timestamp = Date.now().toString().slice(-6);
			return `CTN-${timestamp}-${count.toString().padStart(4, "0")}`;
		} catch (error) {
			console.error("Error generating carton number:", error);
			return `CTN-${Date.now()}-0001`;
		}
	}

	// Get carton statistics
	static async getCartonStats(): Promise<{
		totalCartons: number;
		activeCartons: number;
		archivedCartons: number;
		shippedCartons: number;
		totalValue: number;
		totalProducts: number;
	}> {
		try {
			const cartons = await this.getAllCartons();

			return {
				totalCartons: cartons.length,
				activeCartons: cartons.filter((c) => c.status === "active").length,
				archivedCartons: cartons.filter((c) => c.status === "archived").length,
				shippedCartons: cartons.filter((c) => c.status === "shipped").length,
				totalValue: cartons.reduce((sum, c) => sum + c.totalCost, 0),
				totalProducts: cartons.reduce((sum, c) => sum + c.totalQuantity, 0),
			};
		} catch (error) {
			console.error("Error fetching carton stats:", error);
			throw error;
		}
	}

	// Search cartons
	static async searchCartons(searchTerm: string): Promise<Carton[]> {
		try {
			const allCartons = await this.getAllCartons();
			const lowercaseSearch = searchTerm.toLowerCase();

			return allCartons.filter(
				(carton) =>
					carton.name.toLowerCase().includes(lowercaseSearch) ||
					carton.cartonNumber.toLowerCase().includes(lowercaseSearch) ||
					carton.description?.toLowerCase().includes(lowercaseSearch) ||
					carton.supplier?.toLowerCase().includes(lowercaseSearch)
			);
		} catch (error) {
			console.error("Error searching cartons:", error);
			throw error;
		}
	}
}

export default CartonService;
