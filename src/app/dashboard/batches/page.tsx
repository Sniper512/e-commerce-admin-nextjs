// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

﻿import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import batchService from "@/services/batchService";
import { productService } from "@/services/productService";
import { BatchesList } from "@/components/features/batches/batches-list";
import { getAllBatches } from "@/helpers/firestore_helper_functions/batches/get_methods/getAllBatchesFromDB";
import { stripFirestoreProps } from "@/lib/firestore-utils";



export default async function BatchesPage() {
  // Fetch batches on the server
  const batches = await getAllBatches();

  // Get unique product IDs from batches
  const productIds = [...new Set(batches.map((b) => b.productId))];

  // Fetch product data (name and image) for all products
  const products = await productService.getProductsByIds(productIds);

  // Create a map for quick lookup
  const productMap = new Map(
    products.map((p) => [p.id, { name: p.name, image: p.image }])
  );

  // Enrich batches with product info
  const enrichedBatches = batches.map((batch) => ({
    ...batch,
    productName: productMap.get(batch.productId)?.name || "Unknown Product",
    productImage:
      productMap.get(batch.productId)?.image || "/images/default-image.svg",
  }));

  // Serialize data for client component
  const serializedBatches = stripFirestoreProps(enrichedBatches);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-gray-600">
            Track and manage product batches with expiry dates
          </p>
        </div>
        <Link href="/dashboard/batches/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Batch
          </Button>
        </Link>
      </div>

      {/* Batches List - Client Component */}
      <BatchesList batches={serializedBatches} />
    </div>
  );
}
