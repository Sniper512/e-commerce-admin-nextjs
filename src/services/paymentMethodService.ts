import { PaymentMethod } from "@/types";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/../firebaseConfig";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

const COLLECTION_NAME = "PAYMENT_METHODS";

// Helper function to convert Firestore data to PaymentMethod
const firestoreToPaymentMethod = (id: string, data: any): PaymentMethod => {
  return {
    id,
    type: data.type || "cash_on_delivery",
    isActive: data.isActive ?? true,
    displayOrder: data.displayOrder || 1,
    accountDetails: data.accountDetails || undefined,
  };
};

const paymentMethodService = {
  // Get all payment methods
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const methodsRef = collection(db, COLLECTION_NAME);
      const q = query(methodsRef, orderBy("displayOrder", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        firestoreToPaymentMethod(doc.id, doc.data())
      );
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      throw error;
    }
  },

  // Get active payment methods only
  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const allMethods = await this.getAllPaymentMethods();
      return allMethods.filter((method) => method.isActive);
    } catch (error) {
      console.error("Error fetching active payment methods:", error);
      throw error;
    }
  },

  // Get payment method by ID
  async getPaymentMethodById(id: string): Promise<PaymentMethod | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToPaymentMethod(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error("Error fetching payment method:", error);
      throw error;
    }
  },

  // Create new payment method
  async createPaymentMethod(methodData: Partial<PaymentMethod>): Promise<void> {
    try {
      const methodsRef = collection(db, COLLECTION_NAME);

      const newMethodData = {
        type: methodData.type || "cash_on_delivery",
        isActive: methodData.isActive ?? true,
        displayOrder: methodData.displayOrder || 1,
        accountDetails: methodData.accountDetails || null,
      };

      const sanitizedData = sanitizeForFirestore(newMethodData);
      await addDoc(methodsRef, sanitizedData);
    } catch (error) {
      console.error("Error creating payment method:", error);
      throw error;
    }
  },

  // Update payment method
  async updatePaymentMethod(
    id: string,
    updates: Partial<PaymentMethod>
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Payment method not found");
      }

      // Remove type from updates to prevent changing payment method type
      const { type, ...allowedUpdates } = updates;
      
      const sanitizedData = sanitizeForFirestore(allowedUpdates);
      await updateDoc(docRef, sanitizedData);
    } catch (error) {
      console.error("Error updating payment method:", error);
      throw error;
    }
  },

  // Toggle active status
  async toggleActiveStatus(id: string): Promise<void> {
    try {
      const method = await this.getPaymentMethodById(id);
      if (!method) {
        throw new Error("Payment method not found");
      }

      await this.updatePaymentMethod(id, {
        isActive: !method.isActive,
      });
    } catch (error) {
      console.error("Error toggling payment method status:", error);
      throw error;
    }
  },
};

export default paymentMethodService;
