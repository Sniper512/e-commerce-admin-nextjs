// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

﻿import batchService from "@/services/batchService";
import { productService } from "@/services/productService";
import { notFound } from "next/navigation";
import { BatchDetail } from "@/components/features/batches/batch-detail";
import { getBatchById } from "@/helpers/firestore_helper_functions/batches/get_methods/getBatchByIdFromDB";

interface BatchDetailPageProps {
  params: {
    id: string;
  };
}

export default async function BatchDetailPage({
  params,
}: BatchDetailPageProps) {
  const { id } = await params;

  // Fetch data on the server
  const batch = await getBatchById(id);

  // If batch not found, show 404
  if (!batch) {
    notFound();
  }

  // Fetch product if available
  let product = null;
  if (batch.productId) {
    product = await productService.getById(batch.productId);
  }

  // Serialize data for client component - manually serialize to avoid circular references
  const serializedBatch = {
    ...batch,
    manufacturingDate: batch.manufacturingDate instanceof Date
      ? batch.manufacturingDate.toISOString()
      : batch.manufacturingDate,
    expiryDate: batch.expiryDate instanceof Date
      ? batch.expiryDate.toISOString()
      : batch.expiryDate,
    createdAt: batch.createdAt instanceof Date
      ? batch.createdAt.toISOString()
      : batch.createdAt,
  };

  const serializedProduct = product ? {
    ...product,
    info: {
      ...product.info,
      markAsNewStartDate: product.info?.markAsNewStartDate instanceof Date
        ? product.info.markAsNewStartDate.toISOString()
        : product.info?.markAsNewStartDate,
      markAsNewEndDate: product.info?.markAsNewEndDate instanceof Date
        ? product.info.markAsNewEndDate.toISOString()
        : product.info?.markAsNewEndDate,
    },
    purchaseHistory: product.purchaseHistory?.map((entry: any) => ({
      ...entry,
      orderDate: entry.orderDate instanceof Date
        ? entry.orderDate.toISOString()
        : entry.orderDate,
    })) || [],
  } : null;

  return <BatchDetail batch={serializedBatch as any} product={serializedProduct as any} />;
}
