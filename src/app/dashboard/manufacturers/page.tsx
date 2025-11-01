import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import manufacturerService from "@/services/manufacturerService";
import { ManufacturersList } from "@/components/features/manufacturers/manufacturers-list";

export default async function ManufacturersPage() {
  // Fetch manufacturers on the server
  const manufacturers = await manufacturerService.getAllManufacturers();

  // Serialize data for client component
  const serializedData = JSON.parse(JSON.stringify(manufacturers));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manufacturers</h1>
          <p className="text-gray-600">Manage product manufacturers</p>
        </div>
        <Link href="/dashboard/manufacturers/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Manufacturer
          </Button>
        </Link>
      </div>

      {/* Manufacturers List - Client Component */}
      <ManufacturersList manufacturers={serializedData} />
    </div>
  );
}
