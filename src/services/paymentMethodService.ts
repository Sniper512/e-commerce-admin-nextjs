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
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
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

  // Validate payment method constraints
  async validatePaymentMethod(
    methodData: Partial<PaymentMethod>,
    excludeId?: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      const allMethods = await this.getAllPaymentMethods();
      const type = methodData.type;
      const isActive = methodData.isActive ?? true;
      const accountNumber = methodData.accountDetails?.accountNumber?.trim();
      const accountTitle = methodData.accountDetails?.accountTitle?.trim();
      const bankName = methodData.accountDetails?.bankName?.trim();

      // Rule 1: Only one COD payment method allowed (active or inactive)
      if (type === "cash_on_delivery") {
        const existingCOD = allMethods.find(
          (m) => m.type === "cash_on_delivery" && m.id !== excludeId
        );
        if (existingCOD) {
          return {
            isValid: false,
            error:
              "Only one Cash on Delivery payment method is allowed. Please edit the existing one instead.",
          };
        }
      }

      // Rule 2: Required fields for online payment methods
      if (type && ["jazzcash", "easypaisa", "bank_transfer"].includes(type)) {
        // Account Number is required for all online payment methods
        if (!accountNumber) {
          return {
            isValid: false,
            error: "Account number is required for this payment method.",
          };
        }

        // Account Title is required for all online payment methods (JazzCash, Easypaisa, Bank Transfer)
        if (!accountTitle) {
          return {
            isValid: false,
            error: "Account title is required for this payment method.",
          };
        }

        // Bank Name is required only for Bank Transfer
        if (type === "bank_transfer" && !bankName) {
          return {
            isValid: false,
            error: "Bank name is required for Bank Transfer payment method.",
          };
        }
      }

      // Rule 3: Only one active payment method of each type (for jazzcash, easypaisa, bank_transfer)
      if (
        isActive &&
        type &&
        ["jazzcash", "easypaisa", "bank_transfer"].includes(type)
      ) {
        const existingActiveOfType = allMethods.find(
          (m) => m.type === type && m.isActive && m.id !== excludeId
        );
        if (existingActiveOfType) {
          const typeName = type.replace("_", " ");
          return {
            isValid: false,
            error: `Only one active ${typeName} payment method is allowed. Please deactivate the existing one first.`,
          };
        }
      }

      // Rule 4: No duplicate account numbers within the same payment method type
      // (Only applies to JazzCash and Easypaisa, NOT Bank Transfer)
      if (accountNumber && type && ["jazzcash", "easypaisa"].includes(type)) {
        const duplicateAccount = allMethods.find(
          (m) =>
            m.type === type &&
            m.id !== excludeId &&
            m.accountDetails?.accountNumber?.trim() === accountNumber
        );
        if (duplicateAccount) {
          const typeName = type === "jazzcash" ? "JazzCash" : "Easypaisa";
          return {
            isValid: false,
            error: `This account number is already used for another ${typeName} payment method. Please use a different account number.`,
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error("Error validating payment method:", error);
      throw error;
    }
  },

  // Create new payment method
  async createPaymentMethod(methodData: Partial<PaymentMethod>): Promise<void> {
    // Validate constraints
    const validation = await this.validatePaymentMethod(methodData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const methodsRef = collection(db, COLLECTION_NAME);

    const newMethodData = {
      type: methodData.type || "cash_on_delivery",
      isActive: methodData.isActive ?? true,
      displayOrder: methodData.displayOrder || 1,
      createdAt: methodData.createdAt || new Date(),
      accountDetails: methodData.accountDetails || null,
    };

    const sanitizedData = sanitizeForFirestore(newMethodData);
    await addDoc(methodsRef, sanitizedData);
  },

  // Update payment method
  async updatePaymentMethod(
    id: string,
    updates: Partial<PaymentMethod>
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Payment method not found");
    }

    const currentMethod = firestoreToPaymentMethod(docSnap.id, docSnap.data());

    // Validate constraints if isActive is being changed to true OR if account details are being updated
    const isActivating = updates.isActive === true && !currentMethod.isActive;
    const isUpdatingAccountDetails = updates.accountDetails !== undefined;

    if (isActivating || isUpdatingAccountDetails) {
      const validation = await this.validatePaymentMethod(
        { ...currentMethod, ...updates },
        id
      );
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }

    // Remove type from updates to prevent changing payment method type
    const { type, ...allowedUpdates } = updates;

    const sanitizedData = sanitizeForFirestore(allowedUpdates);
    await updateDoc(docRef, sanitizedData);
  },

  // Toggle active status
  async toggleActiveStatus(id: string): Promise<void> {
    const method = await this.getPaymentMethodById(id);
    if (!method) {
      throw new Error("Payment method not found");
    }

    const newStatus = !method.isActive;

    // Validate if activating
    if (newStatus === true) {
      const validation = await this.validatePaymentMethod(
        { ...method, isActive: newStatus },
        id
      );
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }

    await this.updatePaymentMethod(id, {
      isActive: newStatus,
    });
  },
};

export default paymentMethodService;
