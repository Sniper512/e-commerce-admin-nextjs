// Category Types
export type CategoryType = "simple" | "special";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: CategoryType; // simple or special (e.g., "Summer Sales")
  displayOrder: number;
  image?: string; // Category image URL
  subCategoryCount: number; // Count of subcategories
  isActive: boolean; // Whether category is active
  productIds: string[]; // Array of product IDs in this category
  productCount?: number; // Computed count of products
  showOnHomepage: boolean;
  showOnNavbar: boolean;
}

// SubCategory interface for two-level hierarchy
export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  image?: string;
  parentCategoryId: string; // Reference to parent category
  isActive: boolean;
  productIds: string[];
  productCount?: number;
}

// Category Helper Types and Functions
export interface ParsedCategoryId {
  categoryId: string;
  subCategoryId?: string;
  isSubCategory: boolean;
}

/**
 * Parse a category ID string
 * @param categoryIdString - Format: "categoryId" or "parentCategoryId/subCategoryId"
 * @returns Parsed category information
 */
export function parseCategoryId(categoryIdString: string): ParsedCategoryId {
  const parts = categoryIdString.split("/");

  if (parts.length === 1) {
    return {
      categoryId: parts[0],
      isSubCategory: false,
    };
  }

  return {
    categoryId: parts[0],
    subCategoryId: parts[1],
    isSubCategory: true,
  };
}

/**
 * Create a category ID string
 * @param categoryId - Main category ID
 * @param subCategoryId - Optional subcategory ID
 * @returns Formatted category ID string
 */
export function createCategoryIdString(
  categoryId: string,
  subCategoryId?: string
): string {
  return subCategoryId ? `${categoryId}/${subCategoryId}` : categoryId;
}
