import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/../firebaseConfig";
import { Discount, Product } from "@/types";
import { sanitizeForFirestore } from "@/lib/firestore-utils";
import batchService from "./batchService";
import categoryService from "./categoryService";
import discountService from "./discountService";
import { getStockDataForProducts } from "@/helpers/firestore_helper_functions/stocks/getStockDataForPorducts";

const PRODUCTS_COLLECTION = "PRODUCTS";
const DISCOUNTS_COLLECTION = "DISCOUNTS";
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
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }): Promise<{ products: Product[]; total: number }> {
    // Validate filters to prevent potential issues
    if (filters?.categoryId && typeof filters.categoryId !== 'string') {
      console.warn("Invalid categoryId in getAll filters:", filters.categoryId);
      filters.categoryId = undefined;
    }

    if (filters?.searchQuery && typeof filters.searchQuery !== 'string') {
      console.warn("Invalid searchQuery in getAll filters:", filters.searchQuery);
      filters.searchQuery = undefined;
    }

    const constraints: QueryConstraint[] = [];

    if (filters?.categoryId) {
      constraints.push(
        where("info.categoryIds", "array-contains", filters.categoryId)
      );
    }
    if (filters?.isActive !== undefined) {
      constraints.push(where("info.isActive", "==", filters.isActive));
    }
    if (filters?.searchQuery) {
      const searchTermLower = filters.searchQuery.toLowerCase().trim();
      if (searchTermLower) {
        constraints.push(where("info.nameLower", ">=", searchTermLower));
        constraints.push(where("info.nameLower", "<=", searchTermLower + "\uf8ff"));
        constraints.push(orderBy("info.nameLower"));
      }
    }

    // Get total count first (for pagination)
    const countQuery = query(
      collection(db, PRODUCTS_COLLECTION),
      ...constraints
    );
    const countSnapshot = await getDocs(countQuery);
    const total = countSnapshot.size;

    // Validate and apply pagination with safety limits
    const MAX_LIMIT = 500; // Hard limit to prevent abuse
    const DEFAULT_LIMIT = 50;

    let limit = filters?.limit || DEFAULT_LIMIT;
    let offset = filters?.offset || 0;

    // Enforce maximum limit
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // Ensure positive values
    if (limit <= 0) limit = DEFAULT_LIMIT;
    if (offset < 0) offset = 0;

    // Ensure offset doesn't exceed total
    if (offset >= total && total > 0) {
      offset = Math.max(0, total - limit);
    }

    // Get paginated results
    const q = query(collection(db, PRODUCTS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);

    // Apply manual pagination (slice after fetching)
    const allDocs = snapshot.docs.slice(offset, offset + limit);

    const products = allDocs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
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

    // Fetch batch stock data for all products
    const productIds = products.map((p) => p.id);
    if (productIds.length > 0) {
      // Batch productIds into chunks of 30 to respect Firestore IN query limit
      const BATCH_SIZE = 30;
      const allBatchStockData: Record<string, any> = {};

      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const chunk = productIds.slice(i, i + BATCH_SIZE);
        const chunkStockData = await getStockDataForProducts(
          chunk
        );
        Object.assign(allBatchStockData, chunkStockData);
      }

      // Enrich products with batch stock data
      products.forEach((product) => {
        product.batchStock = allBatchStockData[product.id] || {
          usableStock: 0,
          expiredStock: 0,
          totalStock: 0,
          activeBatchCount: 0,
        };
      });
    }

    return { products, total };
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
      info: {
        ...data.info,
        nameLower: data.info.name.toLowerCase(), // Add lowercase name for case-insensitive search
      },
      price: 0, // Initialize price to 0, will be updated when first batch is added
      featuredDiscountIds: [], // Initialize empty array for featured discounts
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

      // Add manufacturer to parent categories for mobile app filtering
      await this.addManufacturerToCategories(
        productId,
        data.info.manufacturerId,
        data.info.categoryIds
      );
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

    // Update nameLower if name is being updated
    if (data.info?.name) {
      updateData.info = {
        ...data.info,
        nameLower: data.info.name.toLowerCase(),
      };
    }

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

    // Sync manufacturer with categories for mobile app filtering
    const oldManufacturerId = currentProduct.info?.manufacturerId;
    const newManufacturerId = data.info?.manufacturerId;
    const oldCategoryIds = currentProduct.info?.categoryIds || [];
    const newCategoryIds = data.info?.categoryIds || oldCategoryIds;

    await this.updateManufacturerInCategories(
      id,
      oldManufacturerId,
      newManufacturerId,
      oldCategoryIds,
      newCategoryIds
    );
  },

  // Toggle product active status
  async toggleActiveStatus(id: string): Promise<void> {
    try {
      const product = await this.getById(id);
      if (!product) {
        throw new Error("Product not found");
      }

      const newActiveStatus = !product.info.isActive;
      await this.update(id, {
        info: {
          ...product.info,
          isActive: newActiveStatus,
        },
      });
    } catch (error) {
      console.error("Error toggling product active status:", error);
      throw error;
    }
  },

  // Toggle featured discount status for a product
  async toggleFeaturedDiscount(productId: string, discountId: string): Promise<void> {
    try {
      const product = await this.getById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const featuredDiscountIds = product.featuredDiscountIds || [];
      const isCurrentlyFeatured = featuredDiscountIds.includes(discountId);

      let newFeaturedDiscountIds: string[];
      if (isCurrentlyFeatured) {
        // Remove from featured
        newFeaturedDiscountIds = featuredDiscountIds.filter(id => id !== discountId);
      } else {
        // Add to featured
        newFeaturedDiscountIds = [...featuredDiscountIds, discountId];
      }

      await this.update(productId, {
        featuredDiscountIds: newFeaturedDiscountIds,
      });
    } catch (error) {
      console.error("Error toggling featured discount status:", error);
      throw error;
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

  // Search products by name (case-insensitive)
  async searchProducts(searchTerm: string, limit: number = 20): Promise<Product[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return [];
      }

      const searchTermLower = searchTerm.toLowerCase().trim();

      // Use range query for prefix matching on nameLower
      // Note: Firestore requires orderBy on the same field as range queries
      const q = query(
        collection(db, PRODUCTS_COLLECTION),
        where("info.nameLower", ">=", searchTermLower),
        where("info.nameLower", "<=", searchTermLower + "\uf8ff"),
        orderBy("info.nameLower")
      );

      const querySnapshot = await getDocs(q);
// Filter active products client-side since we can't combine isActive with range query easily
const activeProducts = querySnapshot.docs.filter(doc => {
  const data = doc.data();
  return data.info?.isActive === true;
}).slice(0, limit);

const products = activeProducts.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
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

      // Fetch batch stock data for search results
      const productIds = products.map((p) => p.id);
      if (productIds.length > 0) {
        const allBatchStockData: Record<string, any> = {};

        // Batch productIds into chunks of 30
        const BATCH_SIZE = 30;
        for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
          const chunk = productIds.slice(i, i + BATCH_SIZE);
          const chunkStockData = await getStockDataForProducts(chunk);
          Object.assign(allBatchStockData, chunkStockData);
        }

        // Enrich products with batch stock data
        products.forEach((product) => {
          product.batchStock = allBatchStockData[product.id] || {
            usableStock: 0,
            expiredStock: 0,
            totalStock: 0,
            activeBatchCount: 0,
          };
        });
      }

      return products;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
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

  // Get categoryIds associated with a product
  async getCategoryIdsByProductId(productId: string): Promise<string[]> {
    try {
      const productDoc = await this.getById(productId);
      return productDoc?.info?.categoryIds || [];
    } catch (error) {
      console.error("Error fetching category IDs for product:", error);
      throw error;
    }
  },

  // Get discountIds associated with a product
  async getDiscountIdsByProductId(productId: string): Promise<string[]> {
    try {
      const productDoc = await this.getById(productId);
      return productDoc?.discountIds || [];
    } catch (error) {
      console.error("Error fetching discount IDs for product:", error);
      throw error;
    }
  },

  // Get all discount IDs associated with a product (including category and subcategory discounts)
  async getAllDiscountIdsOnProductById(productId: string): Promise<string[]> {
    try {
      const allDiscountIds = [];
      const productDiscountIds = await this.getDiscountIdsByProductId(
        productId
      );
      allDiscountIds.push(...productDiscountIds);
      const categoryIds = await this.getCategoryIdsByProductId(productId);
      await Promise.all(
        categoryIds.map(async (categoryId) => {
          const categoryDiscountIds =
            await categoryService.getDiscountIdsOnCategoryById(categoryId);
          allDiscountIds.push(...categoryDiscountIds);
        })
      );

      // Remove duplicates
      const uniqueDiscountIds = Array.from(new Set(allDiscountIds));
      return uniqueDiscountIds;
    } catch (error) {
      console.error("Error fetching discounts for product:", error);
      throw error;
    }
  },

  // Get highest active discount percentage applicable to a product
  async getHighestActiveDiscountPercentageByProductId(
    productId: string
  ): Promise<number> {
    try {
      const allDiscountIds = await this.getAllDiscountIdsOnProductById(
        productId
      );
      if (allDiscountIds.length === 0) return 0;
      const discountPromises = allDiscountIds.map((discountId) =>
        discountService.getById(discountId)
      );
      const discounts = await Promise.all(discountPromises);
      const validDiscounts = discounts.filter(
        (discount): discount is Discount => discount !== null
      );
      // check if the discount status is active and within date range
      const now = new Date();
      const applicableDiscounts = validDiscounts.filter((discount) => {
        return discountService.isDiscountActive(discount);
      });
      if (applicableDiscounts.length === 0) return 0;
      const highestDiscount = applicableDiscounts.reduce(
        (max, discount) => (discount.value > max ? discount.value : max),
        0
      );
      return highestDiscount;
    } catch (error) {
      console.error("Error fetching highest discount for product:", error);
      throw error;
    }
  },

  // Add manufacturer to parent categories when product is created/updated
  async addManufacturerToCategories(
    productId: string,
    manufacturerId: string,
    categoryIds: string[]
  ): Promise<void> {
    try {
      // Get unique parent category IDs from category/subcategory IDs
      const parentCategoryIds = new Set<string>();

      for (const categoryId of categoryIds) {
        const parsed = parseCategoryId(categoryId);
        parentCategoryIds.add(parsed.categoryId);
      }

      // Add manufacturer to each parent category
      for (const parentCategoryId of parentCategoryIds) {
        await categoryService.addManufacturerToCategory(
          parentCategoryId,
          manufacturerId
        );
      }
    } catch (error) {
      console.error("Error adding manufacturer to categories:", error);
      throw error;
    }
  },

  // Handle manufacturer changes across categories when product is updated
  async updateManufacturerInCategories(
    productId: string,
    oldManufacturerId: string | undefined,
    newManufacturerId: string | undefined,
    oldCategoryIds: string[],
    newCategoryIds: string[]
  ): Promise<void> {
    try {
      // Scenario 1: Manufacturer changed
      if (oldManufacturerId !== newManufacturerId) {
        // Add new manufacturer to new categories
        if (newManufacturerId && newCategoryIds.length > 0) {
          await this.addManufacturerToCategories(
            productId,
            newManufacturerId,
            newCategoryIds
          );
        }

        // Check if old manufacturer can be removed from old categories
        if (oldManufacturerId && oldCategoryIds.length > 0) {
          const oldParentCategoryIds = new Set<string>();
          for (const categoryId of oldCategoryIds) {
            const parsed = parseCategoryId(categoryId);
            oldParentCategoryIds.add(parsed.categoryId);
          }

          for (const parentCategoryId of oldParentCategoryIds) {
            const canRemove = await this.canRemoveManufacturerFromCategory(
              parentCategoryId,
              oldManufacturerId,
              productId
            );

            if (canRemove) {
              await categoryService.removeManufacturerFromCategory(
                parentCategoryId,
                oldManufacturerId
              );
            }
          }
        }
      }
      // Scenario 2: Categories changed (manufacturer stays same)
      else if (newManufacturerId) {
        const categoriesToRemove = oldCategoryIds.filter(
          (catId) => !newCategoryIds.includes(catId)
        );
        const categoriesToAdd = newCategoryIds.filter(
          (catId) => !oldCategoryIds.includes(catId)
        );

        // Add manufacturer to new categories
        if (categoriesToAdd.length > 0) {
          await this.addManufacturerToCategories(
            productId,
            newManufacturerId,
            categoriesToAdd
          );
        }

        // Check if manufacturer can be removed from old categories
        if (categoriesToRemove.length > 0) {
          const oldParentCategoryIds = new Set<string>();
          for (const categoryId of categoriesToRemove) {
            const parsed = parseCategoryId(categoryId);
            oldParentCategoryIds.add(parsed.categoryId);
          }

          for (const parentCategoryId of oldParentCategoryIds) {
            const canRemove = await this.canRemoveManufacturerFromCategory(
              parentCategoryId,
              newManufacturerId,
              productId
            );

            if (canRemove) {
              await categoryService.removeManufacturerFromCategory(
                parentCategoryId,
                newManufacturerId
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating manufacturer in categories:", error);
      throw error;
    }
  },

  // Check if manufacturer can be safely removed from a category
  async canRemoveManufacturerFromCategory(
    parentCategoryId: string,
    manufacturerId: string,
    excludeProductId: string
  ): Promise<boolean> {
    try {
      // Validate inputs to prevent potential infinite loops
      if (!parentCategoryId || !manufacturerId) {
        console.warn("Invalid parameters for canRemoveManufacturerFromCategory:", {
          parentCategoryId,
          manufacturerId,
          excludeProductId
        });
        return true; // Allow removal if parameters are invalid
      }

      // Get the category to ensure it exists
      const category = await categoryService.getCategoryById(parentCategoryId);
      if (!category) return true;

      // Get all subcategories
      const subcategories = await categoryService.getSubCategories(
        parentCategoryId
      );

      // Build list of all category IDs to check (parent + all subcategories)
      const allCategoryIds = [
        parentCategoryId,
        ...subcategories.map((sub) => `${parentCategoryId}/${sub.id}`),
      ];

      // Use direct Firestore query instead of this.getAll to avoid circular references
      for (const categoryId of allCategoryIds) {
        try {
          const q = query(
            collection(db, PRODUCTS_COLLECTION),
            where("info.categoryIds", "array-contains", categoryId),
            where("info.manufacturerId", "==", manufacturerId),
            where("__name__", "!=", excludeProductId)
          );

          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            return false; // Cannot remove, other products use this manufacturer
          }
        } catch (error) {
          console.error(`Error checking products for category ${categoryId}:`, error);
          // Continue checking other categories instead of failing completely
        }
      }

      return true; // Safe to remove
    } catch (error) {
      console.error(
        "Error checking if manufacturer can be removed from category:",
        error
      );
      // Return true to allow removal rather than failing
      return true;
    }
  },

};
