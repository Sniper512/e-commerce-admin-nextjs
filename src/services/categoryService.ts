import { Category, parseCategoryId, SubCategory } from "@/types";
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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import { sanitizeForFirestore, generateSlug } from "@/lib/firestore-utils";

// Helper function to convert Firestore data to Category
const firestoreToCategory = (id: string, data: any): Category => {
  return {
    id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    type: data.type || "simple",
    displayOrder: data.displayOrder || 1,
    image: data.image || undefined,
    subCategoryCount: data.subCategoryCount || 0,
    isActive: data.isActive ?? true,
    productIds: data.productIds || [],
    productCount: data.productCount || 0,
    showOnHomepage: data.showOnHomepage ?? false,
    showOnNavbar: data.showOnNavbar ?? false,
    discountIds: data.discountIds || [],
    manufacturerIds: data.manufacturerIds || [],
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
    image: data.image || undefined,
    parentCategoryId,
    isActive: data.isActive ?? true,
    productIds: data.productIds || [],
    productCount: data.productCount || 0,
    discountIds: data.discountIds || [],
  };
};

const COLLECTION_NAME = "CATEGORIES";
const SUBCATEGORIES_COLLECTION = "SUB_CATEGORIES";

// Build category hierarchy (helper function) - No longer needed with new structure
const buildCategoryHierarchy = (categories: Category[]): Category[] => {
  // Sort by display order
  const result = [...categories];
  result.sort((a, b) => a.displayOrder - b.displayOrder);
  return result;
};

// Category Service Functions using Firebase Firestore
export const categoryService = {
  // Upload category image to Firebase Storage
  async uploadCategoryImage(categoryId: string, file: File): Promise<string> {
    try {
      const storagePath = `CATEGORIES/${categoryId}/category`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading category image:", error);
      throw new Error("Failed to upload category image");
    }
  },

  // Upload subcategory image to Firebase Storage
  async uploadSubCategoryImage(
    categoryId: string,
    subCategoryId: string,
    file: File
  ): Promise<string> {
    try {
      const storagePath = `CATEGORIES/${categoryId}/${subCategoryId}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading subcategory image:", error);
      throw new Error("Failed to upload subcategory image");
    }
  },

  // Delete category image from Firebase Storage
  async deleteCategoryImage(categoryId: string): Promise<void> {
    try {
      const storagePath = `CATEGORIES/${categoryId}/category`;
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      // If file doesn't exist, it's okay to continue
      if ((error as any)?.code !== "storage/object-not-found") {
        console.error("Error deleting category image:", error);
      }
    }
  },

  // Delete subcategory image from Firebase Storage
  async deleteSubCategoryImage(
    categoryId: string,
    subCategoryId: string
  ): Promise<void> {
    try {
      const storagePath = `CATEGORIES/${categoryId}/${subCategoryId}`;
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      // If file doesn't exist, it's okay to continue
      if ((error as any)?.code !== "storage/object-not-found") {
        console.error("Error deleting subcategory image:", error);
      }
    }
  },

  // Delete entire category folder (category + all subcategory images)
  async deleteCategoryFolder(categoryId: string): Promise<void> {
    try {
      // Delete main category image
      await this.deleteCategoryImage(categoryId);

      // Note: Firebase Storage doesn't support folder deletion directly
      // Subcategory images will be deleted individually when subcategories are deleted
    } catch (error) {
      console.error("Error deleting category folder:", error);
    }
  },

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
            subcategories,
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
  async createCategory(
    categoryData: Partial<Category>,
    imageFile?: File | null
  ): Promise<void> {
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
        image: null,
        subCategoryCount: 0,
        isActive: categoryData.isActive ?? true,
        productIds: categoryData.productIds || [],
        productCount: 0,
        showOnHomepage: categoryData.showOnHomepage ?? false,
        showOnNavbar: categoryData.showOnNavbar ?? false,
        discountIds: categoryData.discountIds || [],
      };

      const sanitizedData = sanitizeForFirestore(newCategoryData);
      const docRef = await addDoc(categoriesRef, sanitizedData);

      // Upload image if provided
      let imageURL = null;
      if (imageFile) {
        imageURL = await this.uploadCategoryImage(docRef.id, imageFile);
        await updateDoc(docRef, { image: imageURL });
      }

      return;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  // Create new subcategory
  async createSubCategory(
    parentCategoryId: string,
    subCategoryData: Partial<SubCategory>,
    imageFile?: File | null
  ): Promise<void> {
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
        image: null,
        isActive: subCategoryData.isActive ?? true,
        productIds: subCategoryData.productIds || [],
        productCount: 0,
        discountIds: subCategoryData.discountIds || [],
      };

      const sanitizedData = sanitizeForFirestore(newSubCategoryData);
      const docRef = await addDoc(subCategoriesRef, sanitizedData);

      // Upload image if provided
      let imageURL = null;
      if (imageFile) {
        imageURL = await this.uploadSubCategoryImage(
          parentCategoryId,
          docRef.id,
          imageFile
        );
        await updateDoc(docRef, { image: imageURL });
      }

      // Update parent category count
      await this.updateCategory(parentCategoryId, {
        subCategoryCount: parentCategory.subCategoryCount + 1,
      });

      return;
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
    updates: Partial<Category>,
    imageFile?: File | null
  ): Promise<void> {
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

      // Upload new image if provided
      let imageURL = currentData.image;
      if (imageFile) {
        // Delete old image if exists
        if (currentData.image) {
          await this.deleteCategoryImage(id);
        }
        // Upload new image
        imageURL = await this.uploadCategoryImage(id, imageFile);
      }

      const updateData: any = {
        ...updates,
        image: imageURL,
      };

      // Update slug if name changed
      if (updates.name && updates.name !== currentData.name) {
        updateData.slug = generateSlug(updates.name);
      }

      // Remove undefined values
      const sanitizedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, sanitizedUpdate);

      return;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  // Update subcategory
  async updateSubCategory(
    parentCategoryId: string,
    subCategoryId: string,
    updates: Partial<SubCategory>,
    imageFile?: File | null
  ): Promise<void> {
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

      // Upload new image if provided
      let imageURL = currentData.image;
      if (imageFile) {
        // Delete old image if exists
        if (currentData.image) {
          await this.deleteSubCategoryImage(parentCategoryId, subCategoryId);
        }
        // Upload new image
        imageURL = await this.uploadSubCategoryImage(
          parentCategoryId,
          subCategoryId,
          imageFile
        );
      }

      const updateData: any = {
        ...updates,
        image: imageURL,
      };

      // Update slug if name changed
      if (updates.name && updates.name !== currentData.name) {
        updateData.slug = generateSlug(updates.name);
      }

      const sanitizedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, sanitizedUpdate);

      return;
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

      // Delete category image from storage
      if (category.image) {
        await this.deleteCategoryImage(id);
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

      // Delete subcategory image from storage
      if (subCategory.image) {
        await this.deleteSubCategoryImage(parentCategoryId, subCategoryId);
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

  // Toggle category active status
  async toggleActiveStatus(id: string): Promise<void> {
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    await this.updateCategory(id, {
      isActive: !category.isActive,
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

  // Search categories and subcategories (returns flattened results with composite IDs for subcategories)
  async searchCategoriesAndSubCategories(query: string): Promise<
    Array<{
      id: string; // For main categories: "categoryId", for subcategories: "categoryId/subCategoryId"
      name: string;
      description?: string;
      parentName?: string; // Only for subcategories
      isSubCategory: boolean;
    }>
  > {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const lowercaseQuery = query.toLowerCase().trim();
      const results: Array<{
        id: string;
        name: string;
        description?: string;
        parentName?: string;
        isSubCategory: boolean;
      }> = [];

      // Get all categories with subcategories
      const categoriesRef = collection(db, COLLECTION_NAME);
      const categoriesSnapshot = await getDocs(categoriesRef);

      for (const categoryDoc of categoriesSnapshot.docs) {
        const category = firestoreToCategory(
          categoryDoc.id,
          categoryDoc.data()
        );

        // Check if main category matches
        const categoryMatches =
          category.name.toLowerCase().includes(lowercaseQuery) ||
          category.description?.toLowerCase().includes(lowercaseQuery);

        if (categoryMatches) {
          results.push({
            id: category.id,
            name: category.name,
            description: category.description,
            isSubCategory: false,
          });
        }

        // Search subcategories
        const subCategoriesRef = collection(
          db,
          COLLECTION_NAME,
          categoryDoc.id,
          SUBCATEGORIES_COLLECTION
        );
        const subCategoriesSnapshot = await getDocs(subCategoriesRef);

        for (const subCategoryDoc of subCategoriesSnapshot.docs) {
          const subCategory = firestoreToSubCategory(
            subCategoryDoc.id,
            subCategoryDoc.data(),
            categoryDoc.id
          );

          const subCategoryMatches =
            subCategory.name.toLowerCase().includes(lowercaseQuery) ||
            subCategory.description?.toLowerCase().includes(lowercaseQuery) ||
            category.name.toLowerCase().includes(lowercaseQuery); // Also match if parent matches

          if (subCategoryMatches) {
            results.push({
              id: `${category.id}/${subCategory.id}`, // Composite ID
              name: subCategory.name,
              description: subCategory.description,
              parentName: category.name,
              isSubCategory: true,
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error("Error searching categories and subcategories:", error);
      throw error;
    }
  },

  // Get category statistics
  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    categoriesWithProducts: number;
    emptyCategories: number;
  }> {
    try {
      const allCategories = await this.getAllCategories();

      return {
        totalCategories: allCategories.length,
        activeCategories: allCategories.filter((cat) => cat.isActive).length,
        inactiveCategories: allCategories.filter((cat) => !cat.isActive).length,
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

  // Get discount IDs associated with a category
  async getDiscountIdsOnCategoryById(categoryId: string): Promise<string[]> {
    try {
      const parsedCategoryIdResult = parseCategoryId(categoryId);
      let docRef;
      // Determine if it's a main category or subcategory
      if (parsedCategoryIdResult.isSubCategory) {
        // Subcategory
        docRef = doc(
          db,
          COLLECTION_NAME,
          parsedCategoryIdResult.categoryId,
          SUBCATEGORIES_COLLECTION,
          parsedCategoryIdResult.subCategoryId!
        );
      } else {
        // Main category
        docRef = doc(db, COLLECTION_NAME, parsedCategoryIdResult.categoryId);
      }
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const categoryData = docSnap.data();
        return categoryData.discountIds || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching discount IDs for category:", error);
      throw error;
    }
  },

  // Add manufacturer to category's manufacturerIds array
  async addManufacturerToCategory(
    categoryId: string,
    manufacturerId: string
  ): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, categoryId);
      await updateDoc(categoryRef, {
        manufacturerIds: arrayUnion(manufacturerId),
      });
    } catch (error) {
      console.error("Error adding manufacturer to category:", error);
      throw error;
    }
  },

  // Remove manufacturer from category's manufacturerIds array
  async removeManufacturerFromCategory(
    categoryId: string,
    manufacturerId: string
  ): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, categoryId);
      await updateDoc(categoryRef, {
        manufacturerIds: arrayRemove(manufacturerId),
      });
    } catch (error) {
      console.error("Error removing manufacturer from category:", error);
      throw error;
    }
  },
};

export default categoryService;
