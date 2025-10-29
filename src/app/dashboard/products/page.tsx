import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import categoryService from "@/services/categoryService";
import { ProductsGrid } from "@/components/features/products/products-grid";

export default async function ProductsPage() {
  // Fetch data on the server
  const [products, categories] = await Promise.all([
    productService.getAll(),
    categoryService.getAllCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <Link href="/dashboard/products/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Products Grid with Search and Delete functionality */}
      <ProductsGrid initialProducts={products} categories={categories} />
    </div>
  );
}
