import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import categoryService from "@/services/categoryService";
import { CategoriesList } from "@/components/features/categories/categories-list";

export default async function CategoriesPage() {
  // Fetch categories on the server
  const categories = await categoryService.getAllCategories();

  // Serialize data for client component
  const serializedCategories = JSON.parse(JSON.stringify(categories));

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
      <CategoriesList categories={serializedCategories} />
    </div>
  );
}
