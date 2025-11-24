// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import customerService from "@/services/customerService";
import { CustomersList } from "@/components/features/customers/customers-list";
import { stripFirestoreProps } from "@/lib/firestore-utils";

export default async function CustomersPage() {
  // Fetch customers on the server
  const customers = await customerService.getAllCustomers();

  // Serialize data for client component
  const serializedCustomers = stripFirestoreProps(customers);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600">Manage your customer relationships</p>
        </div>
        <Link href="/dashboard/customers/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </Link>
      </div>

      {/* Customers List - Client Component */}
      <CustomersList customers={serializedCustomers} />
    </div>
  );
}
