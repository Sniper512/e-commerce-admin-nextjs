import { db } from "@/../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { Batch, BatchStatus } from "@/types";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";

const BATCHES_COLLECTION = "BATCHES";
const PRODUCTS_COLLECTION = "PRODUCTS";

// Helper to convert Firestore timestamp to Date
const firestoreToBatch = (id: string, data: any): Batch => {
  return {
    id,
    batchId: data.batchId || "",
    productId: data.productId || "",
    manufacturingDate: convertTimestamp(data.manufacturingDate),
    expiryDate: convertTimestamp(data.expiryDate),
    quantity: data.quantity || 0,
    remainingQuantity: data.remainingQuantity ?? data.quantity ?? 0,
    price: data.price || 0,
    supplier: data.supplier,
    location: data.location,
    notes: data.notes,
    status: data.status || "active",
  };
};

// Helper function to update product price based on batches
async function updateProductPrice(productId: string): Promise<void> {
  try {
    // Get all batches for this product
    const batchesRef = collection(db, BATCHES_COLLECTION);
    const q = query(batchesRef, where("productId", "==", productId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // No batches, set price to 0
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      await updateDoc(productRef, { price: 0 });
      return;
    }

    // Get the highest price from all batches
    const batches = snapshot.docs.map((doc) =>
      firestoreToBatch(doc.id, doc.data())
    );
    const highestPrice = Math.max(...batches.map((batch) => batch.price || 0));

    // Update product price
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, { price: highestPrice });
  } catch (error) {
    console.error("Error updating product price:", error);
    throw error;
  }
}

export const batchService = {
  // Get all batches
  async getAllBatches(): Promise<Batch[]> {
    try {
      const batchesRef = collection(db, BATCHES_COLLECTION);
      const q = query(batchesRef, orderBy("expiryDate", "desc"));
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
  async createBatch(batchData: Omit<Batch, "id">): Promise<void> {
    try {
      const batchesRef = collection(db, BATCHES_COLLECTION);

      // Sanitize data (converts Date to Timestamp automatically)
      const sanitizedData = sanitizeForFirestore({
        batchId: batchData.batchId,
        productId: batchData.productId,
        manufacturingDate: batchData.manufacturingDate, // Will be converted to Timestamp
        expiryDate: batchData.expiryDate, // Will be converted to Timestamp
        quantity: batchData.quantity,
        remainingQuantity: batchData.remainingQuantity,
        price: batchData.price, // Include price
        supplier: batchData.supplier,
        location: batchData.location,
        notes: batchData.notes,
        status: batchData.status || "active",
      });

      await addDoc(batchesRef, sanitizedData);

      // Update product price (sets to highest batch price or first batch price)
      await updateProductPrice(batchData.productId);

      return;
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  },

  // Delete batch
  async deleteBatch(id: string): Promise<void> {
    try {
      // Get the batch to know which product it belongs to
      const batch = await this.getBatchById(id);
      if (!batch) {
        throw new Error("Batch not found");
      }

      const batchRef = doc(db, BATCHES_COLLECTION, id);
      await deleteDoc(batchRef);

      // Recalculate product price after deletion
      await updateProductPrice(batch.productId);
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
      const batchRef = doc(db, BATCHES_COLLECTION, id);
      await updateDoc(batchRef, {
        remainingQuantity: newQuantity,
      });
    } catch (error) {
      console.error("Error adjusting batch quantity:", error);
      throw error;
    }
  },

  // Get stock data for multiple products
  async getStockDataForProducts(productIds: string[]): Promise<
    Record<
      string,
      {
        usableStock: number;
        expiredStock: number;
        totalStock: number;
        activeBatchCount: number;
      }
    >
  > {
    try {
      if (productIds.length === 0) {
        return {};
      }

      const batchesRef = collection(db, BATCHES_COLLECTION);
      const q = query(batchesRef, where("productId", "in", productIds));
      const snapshot = await getDocs(q);

      const stockMap = new Map<
        string,
        {
          usableStock: number;
          totalActiveStock: number;
          expiredStock: number;
          activeBatchCount: number;
        }
      >();

      // Initialize map with zeros for all product IDs
      productIds.forEach((productId) => {
        stockMap.set(productId, {
          usableStock: 0,
          totalActiveStock: 0,
          expiredStock: 0,
          activeBatchCount: 0,
        });
      });

      const now = new Date();

      // Process all batches
      snapshot.docs.forEach((doc) => {
        const batch = firestoreToBatch(doc.id, doc.data());
        const productId = batch.productId;
        const stockData = stockMap.get(productId);

        if (!stockData) return;

        if (batch.status === "active") {
          const expiryDate = new Date(batch.expiryDate);

          // Add to total active stock
          stockData.totalActiveStock += batch.remainingQuantity;
          stockData.activeBatchCount += 1;

          // Check if not expired yet
          if (expiryDate >= now) {
            stockData.usableStock += batch.remainingQuantity;
          }
        } else if (batch.status === "expired") {
          stockData.expiredStock += batch.remainingQuantity;
        }
      });

      // Convert Map to Record
      const result: Record<
        string,
        {
          usableStock: number;
          expiredStock: number;
          totalStock: number;
          activeBatchCount: number;
        }
      > = {};

      stockMap.forEach((value, key) => {
        result[key] = {
          usableStock: value.usableStock,
          expiredStock: value.expiredStock,
          totalStock: value.totalActiveStock,
          activeBatchCount: value.activeBatchCount,
        };
      });

      return result;
    } catch (error) {
      console.error("Error fetching stock data for products:", error);
      throw error;
    }
  },
};

export default batchService;
