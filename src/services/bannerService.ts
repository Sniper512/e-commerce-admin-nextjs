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
import type { Banner } from "@/types";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

const COLLECTION_NAME = "BANNERS";

// Helper function to convert Firestore data to Banner type
const firestoreToBanner = (id: string, data: any): Banner => {
  return {
    id,
    title: data.title || "",
    description: data.description || undefined,
    imageUrl: data.imageUrl || "",
    bannerType: data.bannerType || "homepage",
    linkType: data.linkType || "category",
    link: data.link || "",
    isActive: data.isActive ?? false,
    displayOrder: data.displayOrder || 1,
  };
};

const bannerService = {
  // =====================
  // Storage Operations
  // =====================

  /**
   * Upload banner image to Firebase Storage
   * @param bannerId The banner document ID
   * @param file The image file to upload
   * @returns Download URL of the uploaded image
   */
  async uploadImage(bannerId: string, file: File): Promise<string> {
    try {
      const storagePath = `BANNERS/${bannerId}`;
      const storageRef = ref(storage, storagePath);

      // Upload file
      await uploadBytes(storageRef, file);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading banner image:", error);
      throw new Error("Failed to upload banner image");
    }
  },

  /**
   * Delete banner image from Firebase Storage
   * @param bannerId The banner document ID
   */
  async deleteImage(bannerId: string): Promise<void> {
    try {
      const storagePath = `BANNERS/${bannerId}`;
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      // If file doesn't exist, it's okay to continue
      if ((error as any)?.code !== "storage/object-not-found") {
        console.error("Error deleting banner image:", error);
      }
    }
  },

  // =====================
  // CRUD Operations
  // =====================

  /**
   * Get all banners ordered by displayOrder
   * @returns Array of all banners
   */
  async getAllBanners(): Promise<Banner[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy("displayOrder", "asc")
      );
      const querySnapshot = await getDocs(q);

      const banners: Banner[] = [];
      querySnapshot.forEach((doc) => {
        banners.push(firestoreToBanner(doc.id, doc.data()));
      });

      return banners;
    } catch (error) {
      console.error("Error fetching banners:", error);
      throw error;
    }
  },

  /**
   * Get a banner by ID
   * @param id Banner document ID
   * @returns Banner or null if not found
   */
  async getBannerById(id: string): Promise<Banner | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return firestoreToBanner(docSnap.id, docSnap.data());
      }

      return null;
    } catch (error) {
      console.error("Error fetching banner:", error);
      throw error;
    }
  },

  /**
   * Create a new banner
   * @param data Banner data (without id)
   * @param imageFile Image file to upload
   * @returns Created banner ID
   */
  async createBanner(
    data: Omit<Banner, "id" | "imageUrl">,
    imageFile: File
  ): Promise<string> {
    try {
      // Validate popup banner constraint
      const validation = await this.validateBanner({
        bannerType: data.bannerType,
        isActive: data.isActive,
      });

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Create document first to get ID
      const sanitizedData = sanitizeForFirestore({
        ...data,
        imageUrl: "", // Temporary, will be updated after upload
      });

      const docRef = await addDoc(
        collection(db, COLLECTION_NAME),
        sanitizedData
      );

      // Upload image with the document ID
      const imageUrl = await this.uploadImage(docRef.id, imageFile);

      // Update document with image URL
      await updateDoc(docRef, { imageUrl });

      return docRef.id;
    } catch (error) {
      console.error("Error creating banner:", error);
      throw error;
    }
  },

  /**
   * Update an existing banner
   * @param id Banner document ID
   * @param updates Partial banner data to update
   * @param imageFile Optional new image file to replace existing
   */
  async updateBanner(
    id: string,
    updates: Partial<Omit<Banner, "id">>,
    imageFile?: File
  ): Promise<void> {
    try {
      const currentBanner = await this.getBannerById(id);
      if (!currentBanner) {
        throw new Error("Banner not found");
      }

      // Validate popup banner constraint if activating a popup banner
      if (
        updates.bannerType === "popup" ||
        currentBanner.bannerType === "popup"
      ) {
        const isActivating =
          updates.isActive === true && !currentBanner.isActive;

        if (
          isActivating ||
          (updates.isActive && updates.bannerType === "popup")
        ) {
          const validation = await this.validateBanner(
            {
              bannerType: updates.bannerType || currentBanner.bannerType,
              isActive: updates.isActive ?? currentBanner.isActive,
            },
            id
          );

          if (!validation.isValid) {
            throw new Error(validation.error);
          }
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const sanitizedUpdates = sanitizeForFirestore(updates);

      // If new image provided, upload and delete old
      if (imageFile) {
        // Delete old image
        if (currentBanner.imageUrl) {
          await this.deleteImage(id);
        }

        // Upload new image
        const imageUrl = await this.uploadImage(id, imageFile);
        sanitizedUpdates.imageUrl = imageUrl;
      }

      await updateDoc(docRef, sanitizedUpdates);
    } catch (error) {
      console.error("Error updating banner:", error);
      throw error;
    }
  },

  /**
   * Delete a banner and its image from storage
   * @param id Banner document ID
   */
  async deleteBanner(id: string): Promise<void> {
    try {
      const banner = await this.getBannerById(id);
      if (!banner) {
        throw new Error("Banner not found");
      }

      // Delete image from storage
      if (banner.imageUrl) {
        await this.deleteImage(id);
      }

      // Delete Firestore document
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  },

  // =====================
  // Validation
  // =====================

  /**
   * Validate banner constraints (single active popup rule)
   * @param bannerData Partial banner data to validate
   * @param excludeId Optional banner ID to exclude from validation (for updates)
   * @returns Validation result with error message if invalid
   */
  async validateBanner(
    bannerData: Partial<Banner>,
    excludeId?: string
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Only validate if banner is popup type and active
      if (bannerData.bannerType === "popup" && bannerData.isActive) {
        const allBanners = await this.getAllBanners();

        // Check for existing active popup
        const existingActivePopup = allBanners.find(
          (b) => b.bannerType === "popup" && b.isActive && b.id !== excludeId
        );

        if (existingActivePopup) {
          return {
            isValid: false,
            error:
              "Only one active popup banner is allowed at a time. Please deactivate the existing popup banner first.",
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      console.error("Error validating banner:", error);
      throw error;
    }
  },

  // =====================
  // Utility Methods
  // =====================

  /**
   * Toggle banner active status
   * @param id Banner document ID
   */
  async toggleActiveStatus(id: string): Promise<void> {
    try {
      const banner = await this.getBannerById(id);
      if (!banner) {
        throw new Error("Banner not found");
      }

      const newStatus = !banner.isActive;

      // Validate if activating a popup banner
      if (banner.bannerType === "popup" && newStatus) {
        const validation = await this.validateBanner(
          {
            bannerType: banner.bannerType,
            isActive: newStatus,
          },
          id
        );

        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, { isActive: newStatus });
    } catch (error) {
      console.error("Error toggling banner status:", error);
      throw error;
    }
  },
};

export default bannerService;
