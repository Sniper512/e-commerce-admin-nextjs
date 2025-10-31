import batchService from "@/services/batchService";
import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import { BatchDetail } from "@/components/features/batches/batch-detail";

interface BatchDetailPageProps {
  params: {
    id: string;
  };
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { id } = await params;

  // Fetch data on the server
  const batch = await batchService.getBatchById(id);

  // If batch not found, show 404
  if (!batch) {
    notFound();
  }

  // Fetch product if available
  let product = null;
  if (batch.productId) {
    product = await productService.getById(batch.productId);
  }

  // Serialize data for client component
  const serializedBatch = JSON.parse(JSON.stringify(batch));
  const serializedProduct = product ? JSON.parse(JSON.stringify(product)) : null;

  return <BatchDetail batch={serializedBatch} product={serializedProduct} />;
}
