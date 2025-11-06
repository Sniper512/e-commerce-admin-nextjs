import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import { DiscountForm } from "@/components/features/discounts/discount-form";

export default async function AddDiscountPage() {
  // Fetch data on the server
  const [categories, products] = await Promise.all([
    categoryService.getAllCategories(),
    productService.getAll({ isActive: true }),
  ]);

  // Serialize data for client component
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <DiscountForm
      categories={serializedCategories}
      products={serializedProducts}
    />
  );
}
