import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import type { Manufacturer } from "@/types";

const COLLECTION_NAME = "MANUFACTURERS";

// Helper function to sanitize data for Firestore
const sanitizeForFirestore = (data: any) => {
  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = value === null ? null : value;
    }
  }
  return sanitized;
};

// Helper function to convert Firestore data to Manufacturer
const firestoreToManufacturer = (id: string, data: any): Manufacturer => {
  const convertTimestamp = (timestamp: any): Date => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (typeof timestamp === "string") {
      return new Date(timestamp);
    }
    return new Date();
  };

  return {
    id,
    name: data.name || "",
    description: data.description || "",
    logo: data.logo || undefined,
    displayOrder: data.displayOrder || 1,
    productCount: data.productCount || 0,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    createdBy: data.createdBy || "system",
    updatedBy: data.updatedBy || "system",
  };
};

const manufacturerService = {
  // Get all manufacturers
  async getAllManufacturers(): Promise<Manufacturer[]> {
    try {
      const manufacturersRef = collection(db, COLLECTION_NAME);
      const q = query(manufacturersRef, orderBy("name", "asc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) =>
        firestoreToManufacturer(doc.id, doc.data())
      );
    } catch (error) {
      throw error;
    }
  },

  // Get manufacturer by ID
  async getManufacturerById(id: string): Promise<Manufacturer | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToManufacturer(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Check if manufacturer name already exists
  async checkManufacturerNameExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      const manufacturersRef = collection(db, COLLECTION_NAME);
      const nameLower = name.toLowerCase().trim();
      
      // Get all manufacturers and check manually since Firestore queries are case-sensitive
      const snapshot = await getDocs(manufacturersRef);
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.name.toLowerCase().trim() === nameLower) {
          // If excludeId is provided, skip if it's the same document
          if (excludeId && doc.id === excludeId) {
            continue;
          }
          return true;
        }
      }

      return false;
    } catch (error) {
      throw error;
    }
  },

  // Create new manufacturer
  async createManufacturer(
    manufacturerData: Partial<Manufacturer>
  ): Promise<Manufacturer> {
    try {
      // Check if manufacturer name already exists
      const nameExists = await this.checkManufacturerNameExists(
        manufacturerData.name || ""
      );
      if (nameExists) {
        throw new Error(
          `A manufacturer with the name "${manufacturerData.name}" already exists`
        );
      }

      const manufacturersRef = collection(db, COLLECTION_NAME);

      const newManufacturerData = {
        name: manufacturerData.name || "",
        description: manufacturerData.description || "",
        logo: manufacturerData.logo || null,
        displayOrder: manufacturerData.displayOrder || 1,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current-user",
        updatedBy: "current-user",
      };

      const sanitizedData = sanitizeForFirestore(newManufacturerData);
      const docRef = await addDoc(manufacturersRef, sanitizedData);

      // Wait a moment for serverTimestamp to be written
      await new Promise((resolve) => setTimeout(resolve, 100));

      const createdManufacturer = await this.getManufacturerById(docRef.id);
      if (!createdManufacturer) {
        throw new Error("Failed to retrieve created manufacturer");
      }

      return createdManufacturer;
    } catch (error) {
      throw error;
    }
  },

  // Update manufacturer
  async updateManufacturer(
    id: string,
    updates: Partial<Manufacturer>
  ): Promise<Manufacturer> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Manufacturer not found");
      }

      const currentData = docSnap.data();

      // Check if name is being updated and if it already exists
      if (updates.name && updates.name !== currentData.name) {
        const nameExists = await this.checkManufacturerNameExists(
          updates.name,
          id
        );
        if (nameExists) {
          throw new Error(
            `A manufacturer with the name "${updates.name}" already exists`
          );
        }
      }

      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: "current-user",
      };

      const sanitizedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, sanitizedUpdate);

      const updatedManufacturer = await this.getManufacturerById(id);
      if (!updatedManufacturer) {
        throw new Error("Failed to retrieve updated manufacturer");
      }

      return updatedManufacturer;
    } catch (error) {
      throw error;
    }
  },

  // Delete manufacturer
  async deleteManufacturer(id: string): Promise<boolean> {
    try {
      const manufacturer = await this.getManufacturerById(id);
      if (!manufacturer) {
        throw new Error("Manufacturer not found");
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);

      return true;
    } catch (error) {
      throw error;
    }
  },
};

export default manufacturerService;
