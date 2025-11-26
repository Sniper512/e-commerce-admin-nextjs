// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import { CategoryEditForm } from "@/components/features/categories/category-edit-form";
import type { Product } from "@/types";

interface CategoryDetailPageProps {
  params: {
    id: string;
  };
  searchParams: {
    sub?: string; // subcategory ID if viewing/editing a subcategory
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { id: categoryId } = await params;
  const { sub: subCategoryId } = await searchParams;

  // Fetch category data on the server
  const category = await categoryService.getCategoryById(categoryId);

  // If category not found, show 404
  if (!category) {
    notFound();
  }

  // Determine if we're viewing a subcategory or category
  const isSubCategory = !!subCategoryId;
  let subCategory = null;
  let categoryProducts: Product[] = [];

  if (isSubCategory) {
    // Fetch subcategory
    subCategory = await categoryService.getSubCategoryById(
      categoryId,
      subCategoryId
    );
    if (!subCategory) {
      notFound();
    }

    // Load products for subcategory
    if (subCategory.productIds && subCategory.productIds.length > 0) {
      const allProducts = await productService.getAll({ isActive: true });
      categoryProducts = allProducts.products.filter((p) =>
        subCategory!.productIds.includes(p.id)
      );
    }
  } else {
    // Load products for category
    if (category.productIds && category.productIds.length > 0) {
      const allProducts = await productService.getAll({ isActive: true });
      categoryProducts = allProducts.products.filter((p) =>
        category.productIds.includes(p.id)
      );
    }
  }

  // Fetch subcategories if category has them (only when viewing category, not subcategory)
  const subCategories =
    !isSubCategory && category.subCategoryCount > 0
      ? await categoryService.getSubCategories(categoryId)
      : [];

  // Serialize data for client component - manually serialize to avoid circular references
  const serializedCategory = {
    ...category,
    createdAt: category.createdAt?.toISOString?.() || category.createdAt,
  };

  const serializedSubCategory = subCategory
    ? {
        ...subCategory,
        createdAt: subCategory.createdAt?.toISOString?.() || subCategory.createdAt,
      }
    : null;

  const serializedSubCategories = subCategories.map((sub: any) => ({
    ...sub,
    createdAt: sub.createdAt?.toISOString?.() || sub.createdAt,
  }));

  const serializedProducts = categoryProducts.map((product: any) => ({
    ...product,
    info: {
      ...product.info,
      markAsNewStartDate: product.info?.markAsNewStartDate instanceof Date
        ? product.info.markAsNewStartDate.toISOString()
        : product.info?.markAsNewStartDate,
      markAsNewEndDate: product.info?.markAsNewEndDate instanceof Date
        ? product.info.markAsNewEndDate.toISOString()
        : product.info?.markAsNewEndDate,
    },
    purchaseHistory: product.purchaseHistory?.map((entry: any) => ({
      ...entry,
      orderDate: entry.orderDate instanceof Date
        ? entry.orderDate.toISOString()
        : entry.orderDate,
    })) || [],
  }));

  return (
    <CategoryEditForm
      category={serializedCategory as any}
      subCategory={serializedSubCategory as any}
      subCategories={serializedSubCategories as any}
      products={serializedProducts as any}
      isSubCategory={isSubCategory}
    />
  );
}
