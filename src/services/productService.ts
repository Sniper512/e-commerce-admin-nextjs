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
  arrayUnion,
  arrayRemove,
  increment,
} from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { Product, ProductBatch } from "@/types";

const PRODUCTS_COLLECTION = "PRODUCTS";
const BATCHES_COLLECTION = "BATCHES";
const CATEGORIES_COLLECTION = "CATEGORIES";
const SUBCATEGORIES_COLLECTION = "SUB_CATEGORIES";
const MANUFACTURERS_COLLECTION = "MANUFACTURERS";

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

// Helper: Parse categoryId to determine if it's a main category or subcategory
function parseCategoryId(categoryId: string): {
  categoryId: string;
  subCategoryId: string | null;
} {
  const parts = categoryId.split("/");
  if (parts.length === 2) {
    return { categoryId: parts[0], subCategoryId: parts[1] };
  }
  return { categoryId: parts[0], subCategoryId: null };
}

// Helper: Update category/subcategory when adding a product
async function addProductToCategories(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const updatePromises = categoryIds.map(async (categoryId) => {
    const { categoryId: catId, subCategoryId: subCatId } =
      parseCategoryId(categoryId);

    if (subCatId) {
      // Update subcategory
      const subCatRef = doc(
        db,
        CATEGORIES_COLLECTION,
        catId,
        SUBCATEGORIES_COLLECTION,
        subCatId
      );
      await updateDoc(subCatRef, {
        productIds: arrayUnion(productId),
        productCount: increment(1),
        updatedAt: Timestamp.now(),
        updatedBy: "current-user",
      });
    } else {
      // Update main category
      const catRef = doc(db, CATEGORIES_COLLECTION, catId);
      await updateDoc(catRef, {
        productIds: arrayUnion(productId),
        productCount: increment(1),
        updatedAt: Timestamp.now(),
        updatedBy: "current-user",
      });
    }
  });

  await Promise.all(updatePromises);
}

// Helper: Update category/subcategory when removing a product
async function removeProductFromCategories(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const updatePromises = categoryIds.map(async (categoryId) => {
    const { categoryId: catId, subCategoryId: subCatId } =
      parseCategoryId(categoryId);

    if (subCatId) {
      // Update subcategory
      const subCatRef = doc(
        db,
        CATEGORIES_COLLECTION,
        catId,
        SUBCATEGORIES_COLLECTION,
        subCatId
      );
      await updateDoc(subCatRef, {
        productIds: arrayRemove(productId),
        productCount: increment(-1),
        updatedAt: Timestamp.now(),
        updatedBy: "current-user",
      });
    } else {
      // Update main category
      const catRef = doc(db, CATEGORIES_COLLECTION, catId);
      await updateDoc(catRef, {
        productIds: arrayRemove(productId),
        productCount: increment(-1),
        updatedAt: Timestamp.now(),
        updatedBy: "current-user",
      });
    }
  });

  await Promise.all(updatePromises);
}

// Helper: Update manufacturer when adding a product
async function addProductToManufacturer(
  productId: string,
  manufacturerId: string
): Promise<void> {
  if (!manufacturerId) return;

  const mfgRef = doc(db, MANUFACTURERS_COLLECTION, manufacturerId);
  await updateDoc(mfgRef, {
    productCount: increment(1),
    updatedAt: Timestamp.now(),
    updatedBy: "current-user",
  });
}

// Helper: Update manufacturer when removing a product
async function removeProductFromManufacturer(
  productId: string,
  manufacturerId: string
): Promise<void> {
  if (!manufacturerId) return;

  const mfgRef = doc(db, MANUFACTURERS_COLLECTION, manufacturerId);
  await updateDoc(mfgRef, {
    productCount: increment(-1),
    updatedAt: Timestamp.now(),
    updatedBy: "current-user",
  });
}

// Product Services
export const productService = {
  // Get all products
  async getAll(filters?: {
    categoryId?: string;
    isPublished?: boolean;
  }): Promise<Product[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.categoryId) {
      constraints.push(
        where("categoryIds", "array-contains", filters.categoryId)
      );
    }
    if (filters?.isPublished !== undefined) {
      constraints.push(where("info.isPublished", "==", filters.isPublished));
    }

    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        // Convert nested date fields in stockHistory
        stockHistory:
          data.stockHistory?.map((entry: any) => ({
            ...entry,
            date: entry.date?.toDate?.() || entry.date,
          })) || [],
        // Convert nested date fields in purchaseHistory
        purchaseHistory:
          data.purchaseHistory?.map((entry: any) => ({
            ...entry,
            orderDate: entry.orderDate?.toDate?.() || entry.orderDate,
          })) || [],
        // Convert nested date fields in info section
        info: data.info
          ? {
              ...data.info,
              markAsNewStartDate:
                data.info.markAsNewStartDate?.toDate?.() ||
                data.info.markAsNewStartDate,
              markAsNewEndDate:
                data.info.markAsNewEndDate?.toDate?.() ||
                data.info.markAsNewEndDate,
            }
          : data.info,
      };
    }) as Product[];
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      // Convert nested date fields in stockHistory
      stockHistory:
        data.stockHistory?.map((entry: any) => ({
          ...entry,
          date: entry.date?.toDate?.() || entry.date,
        })) || [],
      // Convert nested date fields in purchaseHistory
      purchaseHistory:
        data.purchaseHistory?.map((entry: any) => ({
          ...entry,
          orderDate: entry.orderDate?.toDate?.() || entry.orderDate,
        })) || [],
      // Convert nested date fields in info section
      info: data.info
        ? {
            ...data.info,
            markAsNewStartDate:
              data.info.markAsNewStartDate?.toDate?.() ||
              data.info.markAsNewStartDate,
            markAsNewEndDate:
              data.info.markAsNewEndDate?.toDate?.() ||
              data.info.markAsNewEndDate,
          }
        : data.info,
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

    const productId = docRef.id;

    // Update related categories/subcategories
    if (data.info?.categoryIds && data.info.categoryIds.length > 0) {
      await addProductToCategories(productId, data.info.categoryIds);
    }

    // Update manufacturer
    if (data.info?.manufacturerId) {
      await addProductToManufacturer(productId, data.info.manufacturerId);
    }

    return productId;
  },

  // Update product
  async update(id: string, data: Partial<Product>): Promise<void> {
    // Get the current product to compare changes
    const currentProduct = await this.getById(id);
    if (!currentProduct) {
      throw new Error("Product not found");
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    // sanitize update payload (remove undefined values and convert Dates)
    let updateDataAny: any = sanitizeForFirestore(data);
    if (updateDataAny === undefined) updateDataAny = {};
    await updateDoc(docRef, {
      ...updateDataAny,
      updatedAt: Timestamp.now(),
    });

    // Handle category changes
    if (data.info?.categoryIds) {
      const oldCategoryIds = currentProduct.info?.categoryIds || [];
      const newCategoryIds = data.info.categoryIds;

      // Find categories to remove and add
      const categoriesToRemove = oldCategoryIds.filter(
        (catId) => !newCategoryIds.includes(catId)
      );
      const categoriesToAdd = newCategoryIds.filter(
        (catId) => !oldCategoryIds.includes(catId)
      );

      // Remove product from old categories
      if (categoriesToRemove.length > 0) {
        await removeProductFromCategories(id, categoriesToRemove);
      }

      // Add product to new categories
      if (categoriesToAdd.length > 0) {
        await addProductToCategories(id, categoriesToAdd);
      }
    }

    // Handle manufacturer changes
    if (data.info?.manufacturerId !== undefined) {
      const oldManufacturerId = currentProduct.info?.manufacturerId;
      const newManufacturerId = data.info.manufacturerId;

      if (oldManufacturerId !== newManufacturerId) {
        // Remove from old manufacturer
        if (oldManufacturerId) {
          await removeProductFromManufacturer(id, oldManufacturerId);
        }

        // Add to new manufacturer
        if (newManufacturerId) {
          await addProductToManufacturer(id, newManufacturerId);
        }
      }
    }
  },

  // Delete product
  async delete(id: string): Promise<void> {
    // Get the product to access its categories and manufacturer
    const product = await this.getById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);

    // Remove product from all associated categories
    if (product.info?.categoryIds && product.info.categoryIds.length > 0) {
      await removeProductFromCategories(id, product.info.categoryIds);
    }

    // Remove product from manufacturer
    if (product.info?.manufacturerId) {
      await removeProductFromManufacturer(id, product.info.manufacturerId);
    }
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
