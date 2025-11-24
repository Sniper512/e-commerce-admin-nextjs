// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

﻿import { productService } from "@/services/productService";
import { BatchForm } from "@/components/features/batches/batch-form";
import { stripFirestoreProps } from "@/lib/firestore-utils";


export default async function AddBatchPage() {
  // Fetch products on the server
  const { products } = await productService.getAll({ isActive: true });

  // Serialize data for client component
  const serializedProducts = stripFirestoreProps(products);

  return <BatchForm products={serializedProducts} />;
}
