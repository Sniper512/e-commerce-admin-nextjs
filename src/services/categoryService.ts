import { Category, SubCategory } from "@/types";
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
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";

// Helper function to convert Firestore data to Category
const firestoreToCategory = (id: string, data: any): Category => {
  return {
    id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    type: data.type || "simple",
    displayOrder: data.displayOrder || 1,
    picture: data.picture || undefined,
    subCategoryCount: data.subCategoryCount || 0,
    isPublished: data.isPublished ?? true,
    productIds: data.productIds || [],
    productCount: data.productCount || 0,
    showOnHomepage: data.showOnHomepage ?? false,
    showOnNavbar: data.showOnNavbar ?? false,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || "system",
    updatedBy: data.updatedBy || "system",
  };
};

// Helper function to convert Firestore data to SubCategory
const firestoreToSubCategory = (
  id: string,
  data: any,
  parentCategoryId: string
): SubCategory => {
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (typeof timestamp === "string") {
      const parsed = new Date(timestamp);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  };

  return {
    id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    displayOrder: data.displayOrder || 1,
    picture: data.picture || undefined,
    parentCategoryId,
    isPublished: data.isPublished ?? true,
    productIds: data.productIds || [],
    productCount: data.productCount || 0,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || "system",
    updatedBy: data.updatedBy || "system",
  };
};

const COLLECTION_NAME = "CATEGORIES";
const SUBCATEGORIES_COLLECTION = "SUB_CATEGORIES";

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

// Build category hierarchy (helper function) - No longer needed with new structure
const buildCategoryHierarchy = (categories: Category[]): Category[] => {
  // Sort by display order
  const result = [...categories];
  result.sort((a, b) => a.displayOrder - b.displayOrder);
  return result;
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

  // Check if category name already exists
  async checkCategoryNameExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const categoriesRef = collection(db, COLLECTION_NAME);
      const slug = generateSlug(name);
      const q = query(categoriesRef, where("slug", "==", slug));
      const snapshot = await getDocs(q);

      // If excludeId is provided, check if any other category has this name
      if (excludeId) {
        return snapshot.docs.some((doc) => doc.id !== excludeId);
      }

      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking category name:", error);
      throw error;
    }
  },

  // Check if subcategory name already exists within a parent category
  async checkSubCategoryNameExists(
    parentCategoryId: string,
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const subCategoriesRef = collection(
        db,
        COLLECTION_NAME,
        parentCategoryId,
        SUBCATEGORIES_COLLECTION
      );
      const slug = generateSlug(name);
      const q = query(subCategoriesRef, where("slug", "==", slug));
      const snapshot = await getDocs(q);

      // If excludeId is provided, check if any other subcategory has this name
      if (excludeId) {
        return snapshot.docs.some((doc) => doc.id !== excludeId);
      }

      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking subcategory name:", error);
      throw error;
    }
  },

  // Get all categories with their subcategories populated
  async getAllCategoriesWithSubCategories(): Promise<any[]> {
    try {
      // First, get all main categories
      const categoriesRef = collection(db, COLLECTION_NAME);
      const q = query(categoriesRef, orderBy("displayOrder", "asc"));
      const snapshot = await getDocs(q);

      const categories = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const category = firestoreToCategory(docSnap.id, docSnap.data());
          
          // Fetch subcategories for this category
          const subcategories = await this.getSubCategories(category.id);
          
          return {
            ...category,
            subcategories
          };
        })
      );

      return categories;
    } catch (error) {
      console.error("Error fetching categories with subcategories:", error);
      throw error;
    }
  },

  // Get subcategory by ID
  async getSubCategories(parentId: string): Promise<SubCategory[]> {
    try {
      const subCategoriesRef = collection(
        db,
        COLLECTION_NAME,
        parentId,
        SUBCATEGORIES_COLLECTION
      );
      const q = query(subCategoriesRef, orderBy("displayOrder", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        firestoreToSubCategory(doc.id, doc.data(), parentId)
      );
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      throw error;
    }
  },

  // Create new category
  async createCategory(categoryData: Partial<Category>): Promise<Category> {
    try {
      // Check if category name already exists
      const nameExists = await this.checkCategoryNameExists(
        categoryData.name || ""
      );
      if (nameExists) {
        throw new Error(
          `A category with the name "${categoryData.name}" already exists`
        );
      }

      const categoriesRef = collection(db, COLLECTION_NAME);

      const newCategoryData = {
        name: categoryData.name || "",
        slug: generateSlug(categoryData.name || ""),
        description: categoryData.description || "",
        type: categoryData.type || "simple",
        displayOrder: categoryData.displayOrder || 1,
        picture: categoryData.picture || null,
        subCategoryCount: 0,
        isPublished: categoryData.isPublished ?? true,
        productIds: categoryData.productIds || [],
        productCount: 0,
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

  // Create new subcategory
  async createSubCategory(
    parentCategoryId: string,
    subCategoryData: Partial<SubCategory>
  ): Promise<SubCategory> {
    try {
      // Check if parent category exists
      const parentCategory = await this.getCategoryById(parentCategoryId);
      if (!parentCategory) {
        throw new Error("Parent category not found");
      }

      // Check if subcategory name already exists within this parent
      const nameExists = await this.checkSubCategoryNameExists(
        parentCategoryId,
        subCategoryData.name || ""
      );
      if (nameExists) {
        throw new Error(
          `A subcategory with the name "${subCategoryData.name}" already exists in "${parentCategory.name}"`
        );
      }

      const subCategoriesRef = collection(
        db,
        COLLECTION_NAME,
        parentCategoryId,
        SUBCATEGORIES_COLLECTION
      );

      const newSubCategoryData = {
        name: subCategoryData.name || "",
        slug: generateSlug(subCategoryData.name || ""),
        description: subCategoryData.description || "",
        displayOrder: subCategoryData.displayOrder || 1,
        picture: subCategoryData.picture || null,
        isPublished: subCategoryData.isPublished ?? true,
        productIds: subCategoryData.productIds || [],
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current-user",
        updatedBy: "current-user",
      };

      const sanitizedData = sanitizeForFirestore(newSubCategoryData);
      const docRef = await addDoc(subCategoriesRef, sanitizedData);

      // Update parent category count
      await this.updateCategory(parentCategoryId, {
        subCategoryCount: parentCategory.subCategoryCount + 1,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const createdSubCategory = await this.getSubCategoryById(
        parentCategoryId,
        docRef.id
      );
      if (!createdSubCategory) {
        throw new Error("Failed to retrieve created subcategory");
      }

      return createdSubCategory;
    } catch (error) {
      console.error("Error creating subcategory:", error);
      throw error;
    }
  },

  // Get subcategory by ID
  async getSubCategoryById(
    parentCategoryId: string,
    subCategoryId: string
  ): Promise<SubCategory | null> {
    try {
      const docRef = doc(
        db,
        COLLECTION_NAME,
        parentCategoryId,
        SUBCATEGORIES_COLLECTION,
        subCategoryId
      );
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToSubCategory(
          docSnap.id,
          docSnap.data(),
          parentCategoryId
        );
      }
      return null;
    } catch (error) {
      console.error("Error fetching subcategory:", error);
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

      // Check if name is being updated and if it already exists
      if (updates.name && updates.name !== currentData.name) {
        const nameExists = await this.checkCategoryNameExists(updates.name, id);
        if (nameExists) {
          throw new Error(
            `A category with the name "${updates.name}" already exists`
          );
        }
      }

      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: "current-user",
      };

      // Update slug if name changed
      if (updates.name && updates.name !== currentData.name) {
        updateData.slug = generateSlug(updates.name);
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

  // Update subcategory
  async updateSubCategory(
    parentCategoryId: string,
    subCategoryId: string,
    updates: Partial<SubCategory>
  ): Promise<SubCategory> {
    try {
      const docRef = doc(
        db,
        COLLECTION_NAME,
        parentCategoryId,
        SUBCATEGORIES_COLLECTION,
        subCategoryId
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Subcategory not found");
      }

      const currentData = docSnap.data();

      // Check if name is being updated and if it already exists
      if (updates.name && updates.name !== currentData.name) {
        const nameExists = await this.checkSubCategoryNameExists(
          parentCategoryId,
          updates.name,
          subCategoryId
        );
        if (nameExists) {
          throw new Error(
            `A subcategory with the name "${updates.name}" already exists in this category`
          );
        }
      }

      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: "current-user",
      };

      // Update slug if name changed
      if (updates.name && updates.name !== currentData.name) {
        updateData.slug = generateSlug(updates.name);
      }

      const sanitizedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, sanitizedUpdate);

      const updatedSubCategory = await this.getSubCategoryById(
        parentCategoryId,
        subCategoryId
      );
      if (!updatedSubCategory) {
        throw new Error("Failed to retrieve updated subcategory");
      }

      return updatedSubCategory;
    } catch (error) {
      console.error("Error updating subcategory:", error);
      throw error;
    }
  },

  // Delete category
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new Error("Category not found");
      }

      // Check if category has subcategories
      if (category.subCategoryCount > 0) {
        throw new Error("Cannot delete category with subcategories");
      }

      // Check if category has products
      if (category.productIds.length > 0) {
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

  // Delete subcategory
  async deleteSubCategory(
    parentCategoryId: string,
    subCategoryId: string
  ): Promise<boolean> {
    try {
      const subCategory = await this.getSubCategoryById(
        parentCategoryId,
        subCategoryId
      );
      if (!subCategory) {
        throw new Error("Subcategory not found");
      }

      // Check if subcategory has products
      if (subCategory.productIds.length > 0) {
        throw new Error("Cannot delete subcategory with products");
      }

      const docRef = doc(
        db,
        COLLECTION_NAME,
        parentCategoryId,
        SUBCATEGORIES_COLLECTION,
        subCategoryId
      );
      await deleteDoc(docRef);

      // Update parent category
      const parentCategory = await this.getCategoryById(parentCategoryId);
      if (parentCategory) {
        const newCount = Math.max(0, parentCategory.subCategoryCount - 1);
        await this.updateCategory(parentCategoryId, {
          subCategoryCount: newCount,
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting subcategory:", error);
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
