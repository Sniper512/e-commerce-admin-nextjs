// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import { productService } from "@/services/productService";
import { DiscountForm } from "@/components/features/discounts/discount-form";
import { safeSerializeForClient } from "@/lib/firestore-utils";

export default async function AddDiscountPage() {
  // Fetch data on the server
  const { products } = await productService.getAll({ isActive: true });

  // Serialize data for client component to prevent circular reference errors
  const serializedProducts = safeSerializeForClient(products);

  return <DiscountForm products={serializedProducts} />;
}
