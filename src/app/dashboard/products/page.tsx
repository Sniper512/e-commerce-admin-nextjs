import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productService } from "@/services/productService";
import categoryService from "@/services/categoryService";
import { ProductsList } from "@/components/features/products/products-list";

export default async function ProductsPage() {
  // Fetch data on the server
  const [products, categories] = await Promise.all([
    productService.getAll(),
    categoryService.getAllCategories(),
  ]);

  // Serialize data for client component
  const serializedProducts = JSON.parse(JSON.stringify(products));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

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

      {/* Products List - Client Component */}
      <ProductsList
        products={serializedProducts}
        categories={serializedCategories}
      />
    </div>
  );
}
