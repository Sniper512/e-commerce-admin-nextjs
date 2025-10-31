import { productService } from "@/services/productService";
import batchService from "@/services/batchService";
import { notFound } from "next/navigation";
import { BatchForm } from "@/components/features/batches/batch-form";

interface EditBatchPageProps {
  params: {
    id: string;
  };
}

export default async function EditBatchPage({ params }: EditBatchPageProps) {
  const { id } = await params;

  // Fetch data on the server
  const [batch, products] = await Promise.all([
    batchService.getBatchById(id),
    productService.getAll(),
  ]);

  // If batch not found, show 404
  if (!batch) {
    notFound();
  }

  // Serialize data for client component
  const serializedBatch = JSON.parse(JSON.stringify(batch));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <BatchForm batch={serializedBatch} products={serializedProducts} />
  );
}
