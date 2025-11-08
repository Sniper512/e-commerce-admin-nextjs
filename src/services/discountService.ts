import { Discount } from "@/types";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  deleteField,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";

// Helper function to convert Firestore data to Discount
const firestoreToDiscount = (id: string, data: any): Discount => {
  return {
    id,
    name: data.name || "",
    description: data.description || undefined,
    type: data.type || "percentage",
    value: data.value || 0,
    applicableTo: data.applicableTo || "order", // Default to order-level discount
    minPurchaseAmount: data.minPurchaseAmount || undefined,
    currentUsageCount: data.currentUsageCount || 0,
    startDate: convertTimestamp(data.startDate),
    endDate: convertTimestamp(data.endDate),
    isActive: data.isActive ?? true,
  };
};

const COLLECTION_NAME = "DISCOUNTS";

// Discount Service Functions using Firebase Firestore
export const discountService = {
  // Get all discounts
  async getAll(): Promise<Discount[]> {
    try {
      const discountsRef = collection(db, COLLECTION_NAME);

      // Try with orderBy first
      try {
        const q = query(discountsRef, orderBy("startDate", "desc"));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) =>
          firestoreToDiscount(doc.id, doc.data())
        );
      } catch (indexError: any) {
        // If orderBy fails, get all and sort in memory
        if (indexError.code === "failed-precondition") {
          console.log(
            `Index not found for getAll query. Falling back to client-side sorting.`
          );
          const snapshot = await getDocs(discountsRef);
          const discounts = snapshot.docs.map((doc) =>
            firestoreToDiscount(doc.id, doc.data())
          );

          return discounts.sort(
            (a, b) => b.startDate.getTime() - a.startDate.getTime()
          );
        }
        throw indexError;
      }
    } catch (error) {
      console.error("Error fetching discounts:", error);
      throw error;
    }
  },

  // Get discounts by applicableTo type
  async getByApplicableTo(
    applicableTo: "products" | "categories" | "order"
  ): Promise<Discount[]> {
    try {
      const discountsRef = collection(db, COLLECTION_NAME);

      // Try with composite query first (requires index)
      try {
        const q = query(
          discountsRef,
          where("applicableTo", "==", applicableTo),
          orderBy("startDate", "desc")
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) =>
          firestoreToDiscount(doc.id, doc.data())
        );
      } catch (indexError: any) {
        // If index is missing, fall back to simple query and sort in memory
        if (indexError.code === "failed-precondition") {
          console.log(
            `Index not found for applicableTo query. Falling back to client-side filtering.`
          );
          const q = query(
            discountsRef,
            where("applicableTo", "==", applicableTo)
          );
          const snapshot = await getDocs(q);

          const discounts = snapshot.docs.map((doc) =>
            firestoreToDiscount(doc.id, doc.data())
          );

          // Sort by startDate descending in memory
          return discounts.sort(
            (a, b) => b.startDate.getTime() - a.startDate.getTime()
          );
        }
        throw indexError;
      }
    } catch (error) {
      console.error(
        `Error fetching discounts for applicableTo ${applicableTo}:`,
        error
      );
      throw error;
    }
  },

  // Get a single discount by ID
  async getById(id: string): Promise<Discount | null> {
    try {
      const discountRef = doc(db, COLLECTION_NAME, id);
      const discountSnap = await getDoc(discountRef);

      if (discountSnap.exists()) {
        return firestoreToDiscount(discountSnap.id, discountSnap.data());
      }
      return null;
    } catch (error) {
      console.error(`Error fetching discount ${id}:`, error);
      throw error;
    }
  },

  // Get active discounts
  async getActive(): Promise<Discount[]> {
    try {
      const discountsRef = collection(db, COLLECTION_NAME);
      const now = Timestamp.fromDate(new Date());

      // Try with composite query first (requires index)
      try {
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
      } catch (indexError: any) {
        // If index is missing, fall back to simpler query and filter in memory
        if (indexError.code === "failed-precondition") {
          console.log(
            `Index not found for active discounts query. Falling back to client-side filtering.`
          );
          const q = query(discountsRef, where("isActive", "==", true));
          const snapshot = await getDocs(q);

          const discounts = snapshot.docs
            .map((doc) => firestoreToDiscount(doc.id, doc.data()))
            .filter(
              (discount) =>
                discount.startDate <= new Date() &&
                discount.endDate >= new Date()
            )
            .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

          return discounts;
        }
        throw indexError;
      }
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      throw error;
    }
  },

  // Get discounts by product ID
  async getByProductId(productId: string): Promise<Discount[]> {
    try {
      const discountsRef = collection(db, COLLECTION_NAME);
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
  },

  // Get discounts by category ID
  async getByCategoryId(categoryId: string): Promise<Discount[]> {
    try {
      const discountsRef = collection(db, COLLECTION_NAME);
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
  },

  // Create a new discount
  async create(
    discountData: Omit<Discount, "id">,
    productIds?: string[],
    categoryIds?: string[]
  ): Promise<string> {
    try {
      const sanitizedData = sanitizeForFirestore({
        ...discountData,
      });

      const discountsRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(discountsRef, sanitizedData);
      const discountId = docRef.id;

      // Handle product associations if applicable
      if (productIds && productIds.length > 0) {
        const { productService } = await import("./productService");
        const updatePromises = productIds.map(async (productId) => {
          try {
            const product = await productService.getById(productId);
            if (product) {
              const existingDiscountIds = product.discountIds || [];
              if (!existingDiscountIds.includes(discountId)) {
                await productService.update(productId, {
                  discountIds: [...existingDiscountIds, discountId],
                });
              }
            }
          } catch (error) {
            console.error(
              `Error adding discount to product ${productId}:`,
              error
            );
          }
        });
        await Promise.all(updatePromises);
      }

      // Handle category associations if applicable
      if (categoryIds && categoryIds.length > 0) {
        const categoryService = (await import("./categoryService")).default;
        const updatePromises = categoryIds.map(async (categoryId) => {
          try {
            // Check if it's a subcategory (composite ID: "parentId/subId")
            if (categoryId.includes("/")) {
              const [parentId, subId] = categoryId.split("/");
              const subcategory = await categoryService.getSubCategoryById(
                parentId,
                subId
              );
              if (subcategory) {
                const existingDiscountIds = subcategory.discountIds || [];
                if (!existingDiscountIds.includes(discountId)) {
                  await categoryService.updateSubCategory(parentId, subId, {
                    discountIds: [...existingDiscountIds, discountId],
                  });
                }
              }
            } else {
              // It's a main category
              const category = await categoryService.getCategoryById(
                categoryId
              );
              if (category) {
                const existingDiscountIds = category.discountIds || [];
                if (!existingDiscountIds.includes(discountId)) {
                  await categoryService.updateCategory(categoryId, {
                    discountIds: [...existingDiscountIds, discountId],
                  });
                }
              }
            }
          } catch (error) {
            console.error(
              `Error adding discount to category ${categoryId}:`,
              error
            );
          }
        });
        await Promise.all(updatePromises);
      }

      return discountId;
    } catch (error) {
      console.error("Error creating discount:", error);
      throw error;
    }
  },

  // Update an existing discount
  async update(
    id: string,
    discountData: Partial<Omit<Discount, "id">>,
    productIds?: string[],
    categoryIds?: string[]
  ): Promise<void> {
    try {
      const discountRef = doc(db, COLLECTION_NAME, id);
      const sanitizedData = sanitizeForFirestore({
        ...discountData,
      });

      // Handle fields that should be explicitly deleted when undefined
      // This ensures empty arrays/undefined values actually clear the fields
      const updateData: any = { ...sanitizedData };

      // If minPurchaseAmount is in the update data, ensure it's set to 0 if empty/undefined
      // For order-level discounts, we always want this field present (even if 0)
      if ("minPurchaseAmount" in discountData) {
        // If it's undefined or null, set to 0; otherwise use the provided value
        updateData.minPurchaseAmount = discountData.minPurchaseAmount ?? 0;
      }

      await updateDoc(discountRef, updateData);

      // Handle product associations if applicable
      if (productIds !== undefined) {
        const { productService } = await import("./productService");
        const allProducts = await productService.getAll();

        // Get old product IDs that have this discount
        const oldProductIds = allProducts
          .filter((p) => p.discountIds?.includes(id))
          .map((p) => p.id);

        // Products to remove discount from
        const productsToRemove = oldProductIds.filter(
          (productId) => !productIds.includes(productId)
        );

        // Products to add discount to
        const productsToAdd = productIds.filter(
          (productId) => !oldProductIds.includes(productId)
        );

        // Remove discount from products
        for (const productId of productsToRemove) {
          try {
            const product = await productService.getById(productId);
            if (product) {
              const updatedDiscountIds = (product.discountIds || []).filter(
                (discountId) => discountId !== id
              );
              await productService.update(productId, {
                discountIds: updatedDiscountIds,
              });
            }
          } catch (error) {
            console.error(
              `Error removing discount from product ${productId}:`,
              error
            );
          }
        }

        // Add discount to products
        for (const productId of productsToAdd) {
          try {
            const product = await productService.getById(productId);
            if (product) {
              const existingDiscountIds = product.discountIds || [];
              if (!existingDiscountIds.includes(id)) {
                await productService.update(productId, {
                  discountIds: [...existingDiscountIds, id],
                });
              }
            }
          } catch (error) {
            console.error(
              `Error adding discount to product ${productId}:`,
              error
            );
          }
        }
      }

      // Handle category associations if applicable
      if (categoryIds !== undefined) {
        const categoryService = (await import("./categoryService")).default;

        // Get all categories with subcategories to find old associations
        const allCategoriesWithSubs =
          await categoryService.getAllCategoriesWithSubCategories();
        const oldCategoryIds: string[] = [];

        // Find all categories and subcategories that have this discount
        allCategoriesWithSubs.forEach((category: any) => {
          if (category.discountIds?.includes(id)) {
            oldCategoryIds.push(category.id);
          }
          if (category.subcategories) {
            category.subcategories.forEach((sub: any) => {
              if (sub.discountIds?.includes(id)) {
                oldCategoryIds.push(`${category.id}/${sub.id}`);
              }
            });
          }
        });

        // Categories to remove discount from
        const categoriesToRemove = oldCategoryIds.filter(
          (categoryId) => !categoryIds.includes(categoryId)
        );

        // Categories to add discount to
        const categoriesToAdd = categoryIds.filter(
          (categoryId) => !oldCategoryIds.includes(categoryId)
        );

        // Remove discount from categories/subcategories
        for (const categoryId of categoriesToRemove) {
          try {
            if (categoryId.includes("/")) {
              // It's a subcategory
              const [parentId, subId] = categoryId.split("/");
              const subcategory = await categoryService.getSubCategoryById(
                parentId,
                subId
              );
              if (subcategory) {
                const updatedDiscountIds = (
                  subcategory.discountIds || []
                ).filter((discountId) => discountId !== id);
                await categoryService.updateSubCategory(parentId, subId, {
                  discountIds: updatedDiscountIds,
                });
              }
            } else {
              // It's a main category
              const category = await categoryService.getCategoryById(
                categoryId
              );
              if (category) {
                const updatedDiscountIds = (category.discountIds || []).filter(
                  (discountId) => discountId !== id
                );
                await categoryService.updateCategory(categoryId, {
                  discountIds: updatedDiscountIds,
                });
              }
            }
          } catch (error) {
            console.error(
              `Error removing discount from category ${categoryId}:`,
              error
            );
          }
        }

        // Add discount to categories/subcategories
        for (const categoryId of categoriesToAdd) {
          try {
            if (categoryId.includes("/")) {
              // It's a subcategory
              const [parentId, subId] = categoryId.split("/");
              const subcategory = await categoryService.getSubCategoryById(
                parentId,
                subId
              );
              if (subcategory) {
                const existingDiscountIds = subcategory.discountIds || [];
                if (!existingDiscountIds.includes(id)) {
                  await categoryService.updateSubCategory(parentId, subId, {
                    discountIds: [...existingDiscountIds, id],
                  });
                }
              }
            } else {
              // It's a main category
              const category = await categoryService.getCategoryById(
                categoryId
              );
              if (category) {
                const existingDiscountIds = category.discountIds || [];
                if (!existingDiscountIds.includes(id)) {
                  await categoryService.updateCategory(categoryId, {
                    discountIds: [...existingDiscountIds, id],
                  });
                }
              }
            }
          } catch (error) {
            console.error(
              `Error adding discount to category ${categoryId}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error updating discount ${id}:`, error);
      throw error;
    }
  },

  // Toggle discount active status
  async toggleStatus(id: string): Promise<void> {
    try {
      const discount = await this.getById(id);
      if (!discount) {
        throw new Error(`Discount ${id} not found`);
      }

      await this.update(id, {
        isActive: !discount.isActive,
      });
    } catch (error) {
      console.error(`Error toggling discount status ${id}:`, error);
      throw error;
    }
  },

  // Check if discount is currently valid
  isValid(discount: Discount): boolean {
    const now = new Date();
    return (
      discount.isActive && discount.startDate <= now && discount.endDate >= now
    );
  },

  // Calculate discount amount
  calculateAmount(discount: Discount, originalPrice: number): number {
    if (discount.type === "percentage") {
      return (originalPrice * discount.value) / 100;
    }
    return discount.value;
  },

  // Apply discount to price
  applyToPrice(discount: Discount, originalPrice: number): number {
    const discountAmount = this.calculateAmount(discount, originalPrice);
    return Math.max(0, originalPrice - discountAmount);
  },
};

export default discountService;
