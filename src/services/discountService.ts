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
    applicableProductIds: data.applicableProductIds || undefined,
    applicableCategoryIds: data.applicableCategoryIds || undefined,
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
      const q = query(discountsRef, orderBy("startDate", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        firestoreToDiscount(doc.id, doc.data())
      );
    } catch (error) {
      console.error("Error fetching discounts:", error);
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
  async create(discountData: Omit<Discount, "id">): Promise<string> {
    try {
      const sanitizedData = sanitizeForFirestore({
        ...discountData,
      });

      const discountsRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(discountsRef, sanitizedData);

      return docRef.id;
    } catch (error) {
      console.error("Error creating discount:", error);
      throw error;
    }
  },

  // Update an existing discount
  async update(
    id: string,
    discountData: Partial<Omit<Discount, "id">>
  ): Promise<void> {
    try {
      const discountRef = doc(db, COLLECTION_NAME, id);
      const sanitizedData = sanitizeForFirestore({
        ...discountData,
      });

      await updateDoc(discountRef, sanitizedData);
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
