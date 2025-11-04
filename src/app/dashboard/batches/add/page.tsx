import { productService } from "@/services/productService";
import { BatchForm } from "@/components/features/batches/batch-form";

export default async function AddBatchPage() {
  // Fetch products on the server
  const products = await productService.getAll({ isPublished: true });

  // Serialize data for client component
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return <BatchForm products={serializedProducts} />;
}
