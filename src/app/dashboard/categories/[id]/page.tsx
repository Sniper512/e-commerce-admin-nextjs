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
      const allProducts = await productService.getAll({ isPublished: true });
      categoryProducts = allProducts.filter((p) =>
        subCategory!.productIds.includes(p.id)
      );
    }
  } else {
    // Load products for category
    if (category.productIds && category.productIds.length > 0) {
      const allProducts = await productService.getAll({ isPublished: true });
      categoryProducts = allProducts.filter((p) =>
        category.productIds.includes(p.id)
      );
    }
  }

  // Fetch subcategories if category has them (only when viewing category, not subcategory)
  const subCategories =
    !isSubCategory && category.subCategoryCount > 0
      ? await categoryService.getSubCategories(categoryId)
      : [];

  // Serialize data for client component
  const serializedCategory = JSON.parse(JSON.stringify(category));
  const serializedSubCategory = subCategory
    ? JSON.parse(JSON.stringify(subCategory))
    : null;
  const serializedSubCategories = JSON.parse(JSON.stringify(subCategories));
  const serializedProducts = JSON.parse(JSON.stringify(categoryProducts));

  return (
    <CategoryEditForm
      category={serializedCategory}
      subCategory={serializedSubCategory}
      subCategories={serializedSubCategories}
      products={serializedProducts}
      isSubCategory={isSubCategory}
    />
  );
}
