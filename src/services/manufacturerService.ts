import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../../firebaseConfig";
import type { Manufacturer } from "@/types";
import { sanitizeForFirestore, convertTimestamp } from "@/lib/firestore-utils";

const COLLECTION_NAME = "MANUFACTURERS";

// Helper function to convert Firestore data to Manufacturer
const firestoreToManufacturer = (id: string, data: any): Manufacturer => {
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
  // Upload logo to Firebase Storage
  async uploadLogo(manufacturerId: string, file: File): Promise<string> {
    try {
      const storagePath = `MANUFACTURERS/${manufacturerId}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading logo:", error);
      throw new Error("Failed to upload logo");
    }
  },

  // Delete logo from Firebase Storage
  async deleteLogo(manufacturerId: string): Promise<void> {
    try {
      const storagePath = `MANUFACTURERS/${manufacturerId}`;
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      // If file doesn't exist, it's okay to continue
      if ((error as any)?.code !== "storage/object-not-found") {
        console.error("Error deleting logo:", error);
      }
    }
  },

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
    manufacturerData: Partial<Manufacturer>,
    logoFile?: File | null
  ): Promise<void> {
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
        displayOrder: manufacturerData.displayOrder || 1,
        logo: null,
        productCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "current-user",
        updatedBy: "current-user",
      };

      const sanitizedData = sanitizeForFirestore(newManufacturerData);
      const docRef = await addDoc(manufacturersRef, sanitizedData);

      // Upload logo if provided
      let logoURL = null;
      if (logoFile) {
        logoURL = await this.uploadLogo(docRef.id, logoFile);
        await updateDoc(docRef, { logo: logoURL });
      }
      return;
    } catch (error) {
      console.error("Error creating manufacturer:", error);
      throw error;
    }
  },

  // Update manufacturer
  async updateManufacturer(
    id: string,
    updates: Partial<Manufacturer>,
    logoFile?: File | null
  ): Promise<void> {
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

      // Upload new logo if provided
      let logoURL = currentData.logo;
      if (logoFile) {
        // Delete old logo if exists
        if (currentData.logo) {
          await this.deleteLogo(id);
        }
        // Upload new logo
        logoURL = await this.uploadLogo(id, logoFile);
      }

      const updateData: any = {
        ...updates,
        logo: logoURL,
        updatedAt: new Date().toISOString(),
        updatedBy: "current-user",
      };

      const sanitizedUpdate = sanitizeForFirestore(updateData);
      await updateDoc(docRef, sanitizedUpdate);

      return;
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

      // Delete logo from storage if exists
      if (manufacturer.logo) {
        await this.deleteLogo(id);
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
