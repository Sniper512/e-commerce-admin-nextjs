import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import { ProductAddForm } from "@/components/features/products/product-add-form";
import { safeSerializeForClient } from "@/lib/firestore-utils";

// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  // Fetch data on the server
  const [productSearchList, discounts, categories, manufacturers] =
    await Promise.all([
      productService.getProductSearchList(), // Lightweight: only id, name, first image
      discountService.getByApplicableTo("products"), // Only get product-level discounts
      categoryService.getAllCategoriesWithSubCategories(),
      manufacturerService.getAllManufacturers(),
    ]);

  // Serialize data for client component - use safe serialization to avoid circular references
  const serializedProductSearchList = safeSerializeForClient(productSearchList);
  const serializedDiscounts = safeSerializeForClient(discounts);
  const serializedCategories = safeSerializeForClient(categories);
  const serializedManufacturers = safeSerializeForClient(manufacturers);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductAddForm
        availableProducts={serializedProductSearchList}
        availableDiscounts={serializedDiscounts}
        categories={serializedCategories}
        manufacturers={serializedManufacturers}
      />
    </Suspense>
  );
}
