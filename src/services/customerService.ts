import { Customer } from "@/types";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

const COLLECTION_NAME = "CUSTOMERS";

// Helper function to convert Firestore data to Customer
const firestoreToCustomer = (id: string, data: any): Customer => {
  return {
    id,
    name: data.name || "",
    phone: data.phone || "",
    address: data.address || undefined,
    totalOrders: data.totalOrders || 0,
    totalSpent: data.totalSpent || 0,
    notificationsEnabled: data.notificationsEnabled ?? true,
    isActive: data.isActive ?? true,
  };
};

const customerService = {
  // Get all customers
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const customersRef = collection(db, COLLECTION_NAME);
      const q = query(customersRef, orderBy("name", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        firestoreToCustomer(doc.id, doc.data())
      );
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToCustomer(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw error;
    }
  },

  // Check if phone number already exists
  async checkPhoneExists(phone: string, excludeId?: string): Promise<boolean> {
    try {
      const customersRef = collection(db, COLLECTION_NAME);
      const phoneClean = phone.trim();

      // Get all customers and check manually since phone might have different formats
      const snapshot = await getDocs(customersRef);

      for (const doc of snapshot.docs) {
        const customerData = doc.data();
        if (
          customerData.phone?.trim() === phoneClean &&
          (!excludeId || doc.id !== excludeId)
        ) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking phone existence:", error);
      throw error;
    }
  },

  // Create new customer
  async createCustomer(customerData: Partial<Customer>): Promise<string> {
    try {
      // Check if phone already exists
      if (customerData.phone) {
        const phoneExists = await this.checkPhoneExists(customerData.phone);
        if (phoneExists) {
          throw new Error("A customer with this phone number already exists");
        }
      }

      const customersRef = collection(db, COLLECTION_NAME);

      const newCustomerData = {
        name: customerData.name || "",
        phone: customerData.phone || "",
        address: customerData.address || "",
        totalOrders: 0,
        totalSpent: 0,
        notificationsEnabled: customerData.notificationsEnabled ?? true,
        isActive: customerData.isActive ?? true,
      };

      const sanitizedData = sanitizeForFirestore(newCustomerData);
      const docRef = await addDoc(customersRef, sanitizedData);

      return docRef.id;
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Customer not found");
      }

      // Check if phone is being updated and if it already exists
      if (updates.phone) {
        const phoneExists = await this.checkPhoneExists(updates.phone, id);
        if (phoneExists) {
          throw new Error("A customer with this phone number already exists");
        }
      }

      const sanitizedData = sanitizeForFirestore(updates);
      await updateDoc(docRef, sanitizedData);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw error;
    }
  },

  // Toggle customer active status
  async toggleActiveStatus(id: string): Promise<void> {
    try {
      const customer = await this.getCustomerById(id);
      if (!customer) {
        throw new Error("Customer not found");
      }

      await this.updateCustomer(id, {
        isActive: !customer.isActive,
      });
    } catch (error) {
      console.error("Error toggling customer status:", error);
      throw error;
    }
  },

  // Search customers
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const allCustomers = await this.getAllCustomers();
      const lowercaseQuery = query.toLowerCase();

      return allCustomers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(lowercaseQuery) ||
          customer.phone.includes(query) ||
          customer.address?.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error("Error searching customers:", error);
      throw error;
    }
  },

  // Get customer statistics
  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const customers = await this.getAllCustomers();

      const totalCustomers = customers.length;
      const activeCustomers = customers.filter((c) => c.isActive).length;
      const inactiveCustomers = totalCustomers - activeCustomers;
      const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
      const totalOrders = customers.reduce((sum, c) => sum + c.totalOrders, 0);
      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        totalCustomers,
        activeCustomers,
        inactiveCustomers,
        totalRevenue,
        averageOrderValue,
      };
    } catch (error) {
      console.error("Error getting customer stats:", error);
      throw error;
    }
  },
};

export default customerService;
