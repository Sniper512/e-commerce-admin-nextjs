import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import { ProductAddForm } from "@/components/features/products/product-add-form";

export default async function AddProductPage() {
  // Fetch data on the server
  const [allProducts, discounts, categories] = await Promise.all([
    productService.getAll({ isActive: true }),
    discountService.getAll(),
    categoryService.getAllCategories(),
  ]);

  // Serialize data for client component
  const serializedAllProducts = JSON.parse(JSON.stringify(allProducts));
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));
  const serializedCategories = JSON.parse(JSON.stringify(categories));

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductAddForm
        availableProducts={serializedAllProducts}
        availableDiscounts={serializedDiscounts}
        categories={serializedCategories}
      />
    </Suspense>
  );
}
