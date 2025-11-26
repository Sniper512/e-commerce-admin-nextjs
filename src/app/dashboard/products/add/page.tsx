import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import { ProductAddForm } from "@/components/features/products/product-add-form";

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

  // Serialize data for client component - manually serialize to avoid circular references
  const serializedProductSearchList = productSearchList.map((product: any) => ({
    id: product.id,
    name: product.name || "",
    image: product.image || "",
  }));

  const serializedDiscounts = discounts.map((discount: any) => ({
    ...discount,
    createdAt: discount.createdAt?.toISOString?.() || discount.createdAt,
    startDate: discount.startDate?.toISOString?.() || discount.startDate,
    endDate: discount.endDate?.toISOString?.() || discount.endDate,
  }));

  const serializedCategories = categories.map((category: any) => ({
    ...category,
    createdAt: category.createdAt?.toISOString?.() || category.createdAt,
    subcategories: category.subcategories?.map((sub: any) => ({
      ...sub,
      createdAt: sub.createdAt?.toISOString?.() || sub.createdAt,
    })) || [],
  }));

  const serializedManufacturers = manufacturers.map((manufacturer: any) => ({
    ...manufacturer,
    createdAt: manufacturer.createdAt?.toISOString?.() || manufacturer.createdAt,
  }));

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
