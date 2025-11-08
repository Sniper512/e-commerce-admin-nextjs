import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import { ProductAddForm } from "@/components/features/products/product-add-form";

export default async function AddProductPage() {
  // Fetch data on the server
  const [productSearchList, discounts, categories, manufacturers] =
    await Promise.all([
      productService.getProductSearchList(), // Lightweight: only id, name, first image
      discountService.getByApplicableTo("products"), // Only get product-level discounts
      categoryService.getAllCategoriesWithSubCategories(),
      manufacturerService.getAllManufacturers(),
    ]);

  // Serialize data for client component
  const serializedProductSearchList = JSON.parse(
    JSON.stringify(productSearchList)
  );
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedManufacturers = JSON.parse(JSON.stringify(manufacturers));

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
