import { Category } from "@/types";
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

// Helper function to convert Firestore data to Category
const firestoreToCategory = (id: string, data: any): Category => {
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
		slug: data.slug || "",
		description: data.description || "",
		type: data.type || "simple",
		displayOrder: data.displayOrder || 1,
		picture: data.picture || undefined,
		parentId: data.parentId || undefined,
		subCategories: data.subCategories || [],
		isPublished: data.isPublished ?? true,
		productIds: data.productIds || [],
		productCount: data.productCount || 0,
		// Legacy fields
		imageUrl: data.imageUrl || data.picture || undefined,
		isActive: data.isActive ?? data.isPublished ?? true,
		showOnHomepage: data.showOnHomepage ?? false,
		showOnNavbar: data.showOnNavbar ?? false,
		createdAt: convertTimestamp(data.createdAt),
		updatedAt: convertTimestamp(data.updatedAt),
		createdBy: data.createdBy || "system",
		updatedBy: data.updatedBy || "system",
	};
};

const COLLECTION_NAME = "CATEGORIES";

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9 -]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.trim();
};

// Build category hierarchy (helper function)
const buildCategoryHierarchy = (categories: Category[]): Category[] => {
	const categoryMap = new Map<string, Category>();
	const result: Category[] = [];

	// First pass: create map
	categories.forEach((category) => {
		categoryMap.set(category.id, { ...category, subCategories: [] });
	});

	// Second pass: build hierarchy
	categoryMap.forEach((category) => {
		if (category.parentId) {
			const parent = categoryMap.get(category.parentId);
			if (parent) {
				category.parentCategory = parent;
				parent.subCategories = parent.subCategories || [];
				parent.subCategories.push(category);
			}
		} else {
			result.push(category);
		}
	});

	// Sort by display order
	result.sort((a, b) => a.displayOrder - b.displayOrder);
	result.forEach((category) => {
		if (category.subCategories) {
			category.subCategories.sort((a, b) => a.displayOrder - b.displayOrder);
		}
	});

	return Array.from(categoryMap.values());
};

// Category Service Functions using Firebase Firestore
export const categoryService = {
	// Get all categories
	async getAllCategories(): Promise<Category[]> {
		try {
			const categoriesRef = collection(db, COLLECTION_NAME);
			const q = query(categoriesRef, orderBy("displayOrder", "asc"));
			const snapshot = await getDocs(q);

			const categories = snapshot.docs.map((doc) =>
				firestoreToCategory(doc.id, doc.data())
			);

			// Build category hierarchy
			return buildCategoryHierarchy(categories);
		} catch (error) {
			console.error("Error fetching categories:", error);
			throw error;
		}
	},

	// Get root categories (no parent)
	async getRootCategories(): Promise<Category[]> {
		try {
			const categoriesRef = collection(db, COLLECTION_NAME);
			const q = query(
				categoriesRef,
				where("parentId", "==", null),
				orderBy("displayOrder", "asc")
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToCategory(doc.id, doc.data())
			);
		} catch (error) {
			console.error("Error fetching root categories:", error);
			throw error;
		}
	},

	// Get category by ID
	async getCategoryById(id: string): Promise<Category | null> {
		try {
			const docRef = doc(db, COLLECTION_NAME, id);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return firestoreToCategory(docSnap.id, docSnap.data());
			}
			return null;
		} catch (error) {
			console.error("Error fetching category:", error);
			throw error;
		}
	},

	// Get subcategories of a parent category
	async getSubCategories(parentId: string): Promise<Category[]> {
		try {
			const categoriesRef = collection(db, COLLECTION_NAME);
			const q = query(
				categoriesRef,
				where("parentId", "==", parentId),
				orderBy("displayOrder", "asc")
			);
			const snapshot = await getDocs(q);

			return snapshot.docs.map((doc) =>
				firestoreToCategory(doc.id, doc.data())
			);
		} catch (error) {
			console.error("Error fetching subcategories:", error);
			throw error;
		}
	},

	// Create new category
	async createCategory(categoryData: Partial<Category>): Promise<Category> {
		try {
			const categoriesRef = collection(db, COLLECTION_NAME);

			const newCategoryData = {
				name: categoryData.name || "",
				slug: generateSlug(categoryData.name || ""),
				description: categoryData.description || "",
				type: categoryData.type || "simple",
				displayOrder: categoryData.displayOrder || 1,
				picture: categoryData.picture || null,
				parentId: categoryData.parentId || null,
				isPublished: categoryData.isPublished ?? true,
				productIds: categoryData.productIds || [],
				productCount: 0,
				// Legacy fields
				imageUrl: categoryData.picture || null,
				isActive: categoryData.isPublished ?? true,
				showOnHomepage: categoryData.showOnHomepage ?? false,
				showOnNavbar: categoryData.showOnNavbar ?? false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				createdBy: "current-user",
				updatedBy: "current-user",
			};

			const sanitizedData = sanitizeForFirestore(newCategoryData);
			const docRef = await addDoc(categoriesRef, sanitizedData);

			// Wait a moment for serverTimestamp to be written
			await new Promise((resolve) => setTimeout(resolve, 100));

			const createdCategory = await this.getCategoryById(docRef.id);
			if (!createdCategory) {
				throw new Error("Failed to retrieve created category");
			}

			return createdCategory;
		} catch (error) {
			console.error("Error creating category:", error);
			throw error;
		}
	},

	// Update category
	async updateCategory(
		id: string,
		updates: Partial<Category>
	): Promise<Category> {
		try {
			const docRef = doc(db, COLLECTION_NAME, id);
			const docSnap = await getDoc(docRef);

			if (!docSnap.exists()) {
				throw new Error("Category not found");
			}

			const currentData = docSnap.data();
			const updateData: any = {
				...updates,
				updatedAt: new Date().toISOString(),
				updatedBy: "current-user",
			};

			// Update slug if name changed
			if (updates.name && updates.name !== currentData.name) {
				updateData.slug = generateSlug(updates.name);
			}

			// Sync legacy fields
			if (updates.picture !== undefined) {
				updateData.imageUrl = updates.picture;
			}
			if (updates.isPublished !== undefined) {
				updateData.isActive = updates.isPublished;
			}

			// Remove undefined values
			const sanitizedUpdate = sanitizeForFirestore(updateData);
			await updateDoc(docRef, sanitizedUpdate);

			const updatedCategory = await this.getCategoryById(id);
			if (!updatedCategory) {
				throw new Error("Failed to retrieve updated category");
			}

			return updatedCategory;
		} catch (error) {
			console.error("Error updating category:", error);
			throw error;
		}
	},

	// Delete category
	async deleteCategory(id: string): Promise<boolean> {
		try {
			// Check if category has subcategories
			const subCategories = await this.getSubCategories(id);
			if (subCategories.length > 0) {
				throw new Error("Cannot delete category with subcategories");
			}

			// Check if category has products
			const category = await this.getCategoryById(id);
			if (category && category.productIds.length > 0) {
				throw new Error("Cannot delete category with products");
			}

			const docRef = doc(db, COLLECTION_NAME, id);
			await deleteDoc(docRef);

			return true;
		} catch (error) {
			console.error("Error deleting category:", error);
			throw error;
		}
	},

	// Toggle category publish status
	async togglePublishStatus(id: string): Promise<Category> {
		const category = await this.getCategoryById(id);
		if (!category) {
			throw new Error("Category not found");
		}

		return this.updateCategory(id, {
			isPublished: !category.isPublished,
			isActive: !category.isPublished,
		});
	},

	// Reorder categories
	async reorderCategories(
		categoryOrders: { id: string; displayOrder: number }[]
	): Promise<Category[]> {
		try {
			const updatePromises = categoryOrders.map(async (order) => {
				const docRef = doc(db, COLLECTION_NAME, order.id);
				return updateDoc(docRef, {
					displayOrder: order.displayOrder,
					updatedAt: new Date().toUTCString(),
				});
			});

			await Promise.all(updatePromises);
			return this.getAllCategories();
		} catch (error) {
			console.error("Error reordering categories:", error);
			throw error;
		}
	},

	// Search categories
	async searchCategories(query: string): Promise<Category[]> {
		const allCategories = await this.getAllCategories();
		const lowercaseQuery = query.toLowerCase();

		return allCategories.filter(
			(category) =>
				category.name.toLowerCase().includes(lowercaseQuery) ||
				category.description?.toLowerCase().includes(lowercaseQuery) ||
				category.slug.toLowerCase().includes(lowercaseQuery)
		);
	},

	// Get category statistics
	async getCategoryStats(): Promise<{
		totalCategories: number;
		publishedCategories: number;
		unpublishedCategories: number;
		categoriesWithProducts: number;
		emptyCategories: number;
	}> {
		try {
			const allCategories = await this.getAllCategories();

			return {
				totalCategories: allCategories.length,
				publishedCategories: allCategories.filter((cat) => cat.isPublished)
					.length,
				unpublishedCategories: allCategories.filter((cat) => !cat.isPublished)
					.length,
				categoriesWithProducts: allCategories.filter(
					(cat) => cat.productIds.length > 0
				).length,
				emptyCategories: allCategories.filter(
					(cat) => cat.productIds.length === 0
				).length,
			};
		} catch (error) {
			console.error("Error fetching category stats:", error);
			throw error;
		}
	},
};

export default categoryService;
