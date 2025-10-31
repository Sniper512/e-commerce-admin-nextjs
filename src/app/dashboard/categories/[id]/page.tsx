import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import { CategoryEditForm } from "@/components/features/categories/category-edit-form";
import type { Product } from "@/types";

interface CategoryDetailPageProps {
  params: {
    id: string;
  };
}

export default async function CategoryDetailPage({
  params,
}: CategoryDetailPageProps) {
  const { id: categoryId } = await params;

  // Fetch category data on the server
  const category = await categoryService.getCategoryById(categoryId);

  // If category not found, show 404
  if (!category) {
    notFound();
  }

  // Load products if category has productIds
  let categoryProducts: Product[] = [];
  if (category.productIds && category.productIds.length > 0) {
    const allProducts = await productService.getAll({ isActive: true });
    categoryProducts = allProducts.filter((p) =>
      category.productIds.includes(p.id)
    );
  }

  // Serialize data for client component
  const serializedCategory = JSON.parse(JSON.stringify(category));
  const serializedProducts = JSON.parse(JSON.stringify(categoryProducts));

  return (
    <CategoryEditForm
      category={serializedCategory}
      products={serializedProducts}
    />
  );
}
