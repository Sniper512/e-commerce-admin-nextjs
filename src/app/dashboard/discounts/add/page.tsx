import { productService } from "@/services/productService";
import { DiscountForm } from "@/components/features/discounts/discount-form";

export default async function AddDiscountPage() {
  // Fetch data on the server
  const products = await productService.getAll({ isActive: true });

  // Serialize data for client component
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return <DiscountForm products={serializedProducts} />;
}
