import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import batchService from "@/services/batchService";
import { BatchesList } from "@/components/features/batches/batches-list";

export default async function BatchesPage() {
  // Fetch batches on the server
  const batches = await batchService.getAllBatches();

  // Serialize data for client component
  const serializedBatches = JSON.parse(JSON.stringify(batches));

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
