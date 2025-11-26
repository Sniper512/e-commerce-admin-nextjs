import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productService } from "@/services/productService";
import categoryService from "@/services/categoryService";
import { ProductsList } from "@/components/features/products/products-list";
import { redirect } from "next/navigation";

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
  const [productsData, categories] = await Promise.all([
    productService.getAll({
      limit,
      offset,
      searchQuery: searchQuery || undefined
    }),
    categoryService.getAllCategoriesWithSubCategories(),
  ]);

  const { products, total } = productsData;
  const totalPages = Math.ceil(total / limit) || 1;

  // Redirect if page exceeds total pages (e.g., ?page=200 when only 10 pages exist)
  if (page > totalPages && totalPages > 0) {
    redirect(`/dashboard/products?page=${totalPages}&limit=${limit}`);
  }

  // Redirect if parameters were adjusted (to clean up URL)
  if (rawPage !== page || rawLimit !== limit) {
    redirect(`/dashboard/products?page=${page}&limit=${limit}`);
  }

  // Serialize data for client component - manually serialize to avoid circular references
  const serializedProducts = products.map((product: any) => ({
    ...product,
    createdAt: product.createdAt?.toISOString?.() || product.createdAt,
    info: {
      ...product.info,
      markAsNewStartDate: product.info?.markAsNewStartDate?.toISOString?.() || product.info?.markAsNewStartDate,
      markAsNewEndDate: product.info?.markAsNewEndDate?.toISOString?.() || product.info?.markAsNewEndDate,
    },
    purchaseHistory: product.purchaseHistory?.map((entry: any) => ({
      ...entry,
      orderDate: entry.orderDate?.toISOString?.() || entry.orderDate,
    })) || [],
    // Ensure batchStock is properly serialized
    batchStock: product.batchStock ? {
      ...product.batchStock,
    } : undefined,
  }));

  const serializedCategories = categories.map((category: any) => ({
    ...category,
    createdAt: category.createdAt?.toISOString?.() || category.createdAt,
    subcategories: category.subcategories?.map((sub: any) => ({
      ...sub,
      createdAt: sub.createdAt?.toISOString?.() || sub.createdAt,
    })) || [],
  }));

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
