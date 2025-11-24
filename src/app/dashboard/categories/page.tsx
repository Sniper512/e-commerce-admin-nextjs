// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

﻿import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import categoryService from "@/services/categoryService";
import { CategoriesList } from "@/components/features/categories/categories-list";
import type { Category, SubCategory } from "@/types";
import { stripFirestoreProps } from "@/lib/firestore-utils";

export default async function CategoriesPage() {
  // Fetch categories on the server
  const categories = await categoryService.getAllCategories();

  // Fetch subcategories for each category
  const categoriesWithSubCategories: Array<{
    category: Category;
    subCategories: SubCategory[];
  }> = await Promise.all(
    categories.map(async (category) => ({
      category,
      subCategories: category.subCategoryCount > 0
        ? await categoryService.getSubCategories(category.id)
        : [],
    }))
  );

  // Serialize data for client component
  const serializedData = stripFirestoreProps(categoriesWithSubCategories);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">
            Organize your products into categories
          </p>
        </div>
        <Link href="/dashboard/categories/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Categories List - Client Component */}
      <CategoriesList categoriesWithSubCategories={serializedData} />
    </div>
  );
}
