// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import { notFound } from "next/navigation";
import { DiscountForm } from "@/components/features/discounts/discount-form";
import { safeSerializeForClient } from "@/lib/firestore-utils";

interface DiscountDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountDetailPage({
  params,
}: DiscountDetailPageProps) {
  const { id } = await params;

  // Fetch data on the server
  const [discount, productsData] = await Promise.all([
    discountService.getById(id),
    productService.getAll(), // Load ALL products, not just active ones
  ]);

  const { products } = productsData;

  // If discount not found, show 404
  if (!discount) {
    notFound();
  }

  // Only fetch categories with subcategories if this discount is applicable to categories
  let categories = [];
  if (discount.applicableTo === "categories") {
    categories = await categoryService.getAllCategoriesWithSubCategories();
  }

  // Serialize data for client component to prevent circular reference errors
  const serializedDiscount = safeSerializeForClient(discount);
  const serializedCategories = safeSerializeForClient(categories);
  const serializedProducts = safeSerializeForClient(products);

  return (
    <DiscountForm
      discount={serializedDiscount}
      categories={serializedCategories}
      products={serializedProducts}
    />
  );
}
