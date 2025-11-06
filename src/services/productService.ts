import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  QueryConstraint,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/../firebaseConfig";
import { Product } from "@/types";
import { sanitizeForFirestore } from "@/lib/firestore-utils";

const PRODUCTS_COLLECTION = "PRODUCTS";
const BATCHES_COLLECTION = "BATCHES";
const CATEGORIES_COLLECTION = "CATEGORIES";
const SUBCATEGORIES_COLLECTION = "SUB_CATEGORIES";
const MANUFACTURERS_COLLECTION = "MANUFACTURERS";

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
      });
    } else {
      // Update main category
      const catRef = doc(db, CATEGORIES_COLLECTION, catId);
      await updateDoc(catRef, {
        productIds: arrayUnion(productId),
        productCount: increment(1),
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
      });
    } else {
      // Update main category
      const catRef = doc(db, CATEGORIES_COLLECTION, catId);
      await updateDoc(catRef, {
        productIds: arrayRemove(productId),
        productCount: increment(-1),
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
  });
}

// Helper: Upload product images to Firebase Storage
/**
 * Handles both new uploads and existing images:
 * - Items with file property: Upload to Firebase Storage
 * - Items with url property: Keep existing URL
 * Returns array with all images (uploaded + retained) in same order
 * Note: First image in array is treated as primary
 */
async function uploadProductImages(
  productId: string,
  images: Array<{
    file?: File;
    url?: string;
  }>
): Promise<string[]> {
  const uploadedImages: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    if (image.file) {
      // Upload new file
      const timestamp = Date.now() + i; // Add index to ensure unique timestamps
      const storagePath = `PRODUCTS/${productId}/images/${timestamp}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, image.file);
      const downloadURL = await getDownloadURL(storageRef);

      uploadedImages.push(downloadURL);
    } else if (image.url) {
      // Keep existing URL
      uploadedImages.push(image.url);
    }
  }

  return uploadedImages;
}

// Helper: Upload product video to Firebase Storage
async function uploadProductVideo(
  productId: string,
  video: { file?: File; url?: string } | null
): Promise<string> {
  if (!video) return "";

  if (video.file) {
    // Upload new file
    const storagePath = `PRODUCTS/${productId}/video`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, video.file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } else if (video.url) {
    // Keep existing URL (YouTube, etc.)
    return video.url;
  }

  return "";
}

// Helper: Delete a single product image from storage by URL
async function deleteProductImageByUrl(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl) return;

    // Check if it's a Firebase Storage URL (production or emulator)
    const isFirebaseStorage =
      imageUrl.includes("firebasestorage.googleapis.com") ||
      imageUrl.includes("firebasestorage.app") ||
      (imageUrl.includes("localhost") && imageUrl.includes("/v0/b/"));

    if (!isFirebaseStorage) {
      return;
    }

    // For Firebase Storage URLs, we need to extract the path
    // Production: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...
    // Emulator: http://localhost:9199/v0/b/{bucket}/o/{path}?alt=media&token=...
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);

    if (pathMatch) {
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    // If file doesn't exist, it's okay to continue
    if ((error as any)?.code !== "storage/object-not-found") {
      console.error("Error deleting product image:", imageUrl, error);
    }
  }
}

// Helper: Delete multiple product images from storage
async function deleteProductImages(imageUrls: string[]): Promise<void> {
  try {
    const deletePromises = imageUrls.map((url) => deleteProductImageByUrl(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting product images:", error);
  }
}

// Helper: Delete product video from storage by URL
async function deleteProductVideoByUrl(videoUrl: string): Promise<void> {
  try {
    if (!videoUrl) return;

    // Check if it's a Firebase Storage URL (production or emulator)
    const isFirebaseStorage =
      videoUrl.includes("firebasestorage.googleapis.com") ||
      videoUrl.includes("firebasestorage.app") ||
      (videoUrl.includes("localhost") && videoUrl.includes("/v0/b/"));

    if (!isFirebaseStorage) {
      return;
    }

    // For Firebase Storage URLs, we need to extract the path
    // Production: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...
    // Emulator: http://localhost:9199/v0/b/{bucket}/o/{path}?alt=media&token=...
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);

    if (pathMatch) {
      const encodedPath = pathMatch[1];
      const decodedPath = decodeURIComponent(encodedPath);
      const storageRef = ref(storage, decodedPath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    // If file doesn't exist, it's okay to continue
    if ((error as any)?.code !== "storage/object-not-found") {
      console.error("Error deleting product video:", videoUrl, error);
    }
  }
}

// Product Services
export const productService = {
  // Get all products
  async getAll(filters?: {
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Product[]> {
    const constraints: QueryConstraint[] = [];

    if (filters?.categoryId) {
      constraints.push(
        where("categoryIds", "array-contains", filters.categoryId)
      );
    }
    if (filters?.isActive !== undefined) {
      constraints.push(where("info.isActive", "==", filters.isActive));
    }

    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
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
    data: Omit<Product, "id">,
    images?: Array<{
      file?: File;
      url?: string;
    }>,
    video?: { file?: File; url?: string } | null
  ): Promise<string> {
    // Pre-generate product ID
    const productId = doc(collection(db, PRODUCTS_COLLECTION)).id;

    // Upload images if provided
    let uploadedImages: string[] = [];
    if (images && images.length > 0) {
      uploadedImages = await uploadProductImages(productId, images);
    }

    // Upload video if provided
    let uploadedVideo: string = "";
    if (video) {
      uploadedVideo = await uploadProductVideo(productId, video);
    }

    // Prepare product data with uploaded media URLs
    const productData = {
      ...data,
      multimedia: {
        images: uploadedImages,
        video: uploadedVideo,
      },
    };

    // sanitize input to remove undefined and convert Dates
    const payload = sanitizeForFirestore(productData);

    // Create document with pre-generated ID
    await setDoc(doc(db, PRODUCTS_COLLECTION, productId), {
      ...payload,
    });

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
  /**
   * Update a product with proper handling of multimedia files
   *
   * IMAGE SCENARIOS:
   * 1. No images → Add images: images array with files, all get uploaded
   * 2. Has images → Remove all: images = [], all old images deleted
   * 3. Has images → Mixed changes:
   *    - Items with url (no file) = retained existing images
   *    - Items with file = new images to upload
   *    - Old images not in new list = deleted from storage
   *
   * Note: First image in array is always treated as primary
   *
   * VIDEO SCENARIOS:
   * 1. No video → Add video: video = { file }, gets uploaded
   * 2. Has video → Remove: video = null, old video deleted
   * 3. Has video → Replace: video = { file }, old deleted, new uploaded
   * 4. Has video → Keep: video = { url }, existing video retained
   * 5. Not provided: video = undefined, existing video kept
   */
  async update(
    id: string,
    data: Partial<Product>,
    images?: Array<{
      file?: File;
      url?: string;
    }>,
    video?: { file?: File; url?: string } | null
  ): Promise<void> {
    // Get the current product to compare changes
    const currentProduct = await this.getById(id);
    if (!currentProduct) {
      throw new Error("Product not found");
    }

    // Handle image updates and deletions
    let finalImages: string[] = [];
    if (images !== undefined) {
      // Separate existing images (with URLs) from new images (with files)
      const existingImages = images.filter((img) => img.url && !img.file);
      const newImages = images.filter((img) => img.file);

      // Upload new images
      let uploadedNewImages: string[] = [];
      if (newImages.length > 0) {
        uploadedNewImages = await uploadProductImages(id, newImages);
      }

      // Retain existing images
      const retainedImages: string[] = existingImages.map((img) => img.url!);

      // Combine retained and newly uploaded images
      finalImages = [...retainedImages, ...uploadedNewImages];

      // Delete old images that are no longer in the retained list
      if (currentProduct.multimedia?.images) {
        const retainedImageUrls = retainedImages;
        const oldImageUrls = currentProduct.multimedia.images;

        // Filter images that should be deleted (not retained and are Firebase Storage URLs)
        const imagesToDelete = oldImageUrls.filter((url) => {
          if (retainedImageUrls.includes(url)) return false;

          // Check if it's a Firebase Storage URL (production or emulator)
          return (
            url.includes("firebasestorage.googleapis.com") ||
            url.includes("firebasestorage.app") ||
            (url.includes("localhost") && url.includes("/v0/b/"))
          );
        });

        if (imagesToDelete.length > 0) {
          await deleteProductImages(imagesToDelete);
        }
      }
    }

    // Handle video updates and deletions
    let finalVideo: string = "";
    if (video !== undefined) {
      if (video === null) {
        // Video was explicitly removed - delete old video if it exists
        const oldVideoUrl = currentProduct.multimedia?.video;
        if (oldVideoUrl) {
          const isFirebaseStorage =
            oldVideoUrl.includes("firebasestorage.googleapis.com") ||
            oldVideoUrl.includes("firebasestorage.app") ||
            (oldVideoUrl.includes("localhost") &&
              oldVideoUrl.includes("/v0/b/"));

          if (isFirebaseStorage) {
            await deleteProductVideoByUrl(oldVideoUrl);
          }
        }
        finalVideo = "";
      } else if (video.file) {
        // New video file to upload
        finalVideo = await uploadProductVideo(id, video);

        // Delete old video if it exists
        const oldVideoUrl = currentProduct.multimedia?.video;
        if (oldVideoUrl) {
          const isFirebaseStorage =
            oldVideoUrl.includes("firebasestorage.googleapis.com") ||
            oldVideoUrl.includes("firebasestorage.app") ||
            (oldVideoUrl.includes("localhost") &&
              oldVideoUrl.includes("/v0/b/"));

          if (isFirebaseStorage) {
            await deleteProductVideoByUrl(oldVideoUrl);
          }
        }
      } else if (video.url) {
        // Existing video URL - retain it
        finalVideo = video.url;
      }
    } else {
      // Video parameter not provided - keep existing
      finalVideo = currentProduct.multimedia?.video || "";
    }

    // Prepare update data with uploaded media
    const updateData = { ...data };

    // Build multimedia object based on what was provided
    if (images !== undefined || video !== undefined) {
      updateData.multimedia = {
        images:
          images !== undefined
            ? finalImages
            : currentProduct.multimedia?.images || [],
        video:
          video !== undefined
            ? finalVideo
            : currentProduct.multimedia?.video || "",
      };
    }

    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    // sanitize update payload (remove undefined values and convert Dates)
    let updateDataAny: any = sanitizeForFirestore(updateData);
    if (updateDataAny === undefined) updateDataAny = {};
    await updateDoc(docRef, {
      ...updateDataAny,
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
    // Get the product to access its categories, manufacturer, and media
    const product = await this.getById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    // Delete all product images from storage
    if (product.multimedia?.images && product.multimedia.images.length > 0) {
      const imageUrls = product.multimedia.images.filter((url) => {
        // Filter Firebase Storage URLs (production or emulator)
        return (
          url.includes("firebasestorage.googleapis.com") ||
          url.includes("firebasestorage.app") ||
          (url.includes("localhost") && url.includes("/v0/b/"))
        );
      });

      if (imageUrls.length > 0) {
        await deleteProductImages(imageUrls);
      }
    }

    // Delete product video from storage
    const videoUrl = product.multimedia?.video;
    if (videoUrl) {
      const isFirebaseStorage =
        videoUrl.includes("firebasestorage.googleapis.com") ||
        videoUrl.includes("firebasestorage.app") ||
        (videoUrl.includes("localhost") && videoUrl.includes("/v0/b/"));

      if (isFirebaseStorage) {
        await deleteProductVideoByUrl(videoUrl);
      }
    }

    // Delete the Firestore document
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

  // Get lightweight product list for search (id, name, first image only)
  async getProductSearchList(): Promise<
    Array<{ id: string; name: string; image: string }>
  > {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where("info.isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.info?.name || "",
        image: data.multimedia?.images?.[0] || "",
      };
    });
  },

  // Get product details by IDs (for populating similar/bought-together products)
  async getProductsByIds(
    productIds: string[]
  ): Promise<Array<{ id: string; name: string; image: string }>> {
    if (!productIds || productIds.length === 0) return [];

    // Firestore 'in' query supports max 30 items, so batch if needed
    const batchSize = 30;
    const batches: string[][] = [];
    for (let i = 0; i < productIds.length; i += batchSize) {
      batches.push(productIds.slice(i, i + batchSize));
    }

    const allProducts: Array<{ id: string; name: string; image: string }> = [];

    for (const batch of batches) {
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("__name__", "in", batch)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        allProducts.push({
          id: doc.id,
          name: data.info?.name || "",
          image: data.multimedia?.images?.[0] || "",
        });
      });
    }

    return allProducts;
  },
};
