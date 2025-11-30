import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productService } from "@/services/productService";
import categoryService from "@/services/categoryService";
import { ProductsList } from "@/components/features/products/products-list";
import { redirect } from "next/navigation";
import { safeSerializeForClient } from "@/lib/firestore-utils";

// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
    search?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  // Get pagination and search params from URL with validation
  const params = await searchParams;
  const rawPage = Number(params?.page) || 1;
  const rawLimit = Number(params?.limit) || 50;
  const searchQuery = params?.search?.trim() || "";

  // Validate and constrain parameters
  const MIN_LIMIT = 10;
  const MAX_LIMIT = 200;
  const DEFAULT_LIMIT = 50;

  // Constrain limit between MIN and MAX
  let limit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, rawLimit));

  // Ensure limit is a valid number, default to 50 if invalid
  if (isNaN(limit) || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }

  // Ensure page is at least 1
  let page = Math.max(1, rawPage);
  if (isNaN(page) || page <= 0) {
    page = 1;
  }

  const offset = (page - 1) * limit;

  // Fetch data on the server with pagination and search
  let products: any[] = [];
  let total = 0;
  let totalPages = 1;

  if (searchQuery) {
    // Use enhanced search for search queries
    products = await productService.searchProducts(searchQuery, 500); // Higher limit for search
    total = products.length;
    totalPages = Math.ceil(total / limit) || 1;

    // Apply manual pagination to search results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    products = products.slice(startIndex, endIndex);
  } else {
    // Use regular pagination for non-search requests
    const productsData = await productService.getAll({
      limit,
      offset,
    });
    products = productsData.products;
    total = productsData.total;
    totalPages = Math.ceil(total / limit) || 1;
  }

  const categories = await categoryService.getAllCategoriesWithSubCategories();

  // Handle redirects
  if (page > totalPages && totalPages > 0) {
    const redirectUrl = searchQuery
      ? `/dashboard/products?page=${totalPages}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`
      : `/dashboard/products?page=${totalPages}&limit=${limit}`;
    redirect(redirectUrl);
  }

  // Redirect if parameters were adjusted (to clean up URL)
  if (rawPage !== page || rawLimit !== limit) {
    const redirectUrl = searchQuery
      ? `/dashboard/products?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}`
      : `/dashboard/products?page=${page}&limit=${limit}`;
    redirect(redirectUrl);
  }

  // Serialize data for client component - deep clone first to remove circular references, then safe serialize
  const serializedProducts = safeSerializeForClient(JSON.parse(JSON.stringify(products)));
  const serializedCategories = safeSerializeForClient(JSON.parse(JSON.stringify(categories)));

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
        currentPage={page}
        totalPages={totalPages}
        totalProducts={total}
        pageSize={limit}
      />
    </div>
  );
}
