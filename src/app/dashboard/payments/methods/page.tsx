// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import paymentMethodService from "@/services/paymentMethodService";
import { PaymentMethodsList } from "@/components/features/payments/payment-methods-list";

export default async function PaymentMethodsPage() {
  // Fetch payment methods on the server
  const paymentMethods = await paymentMethodService.getAllPaymentMethods();

  // Serialize data for client component - manually serialize to avoid circular references
  const serializedData = paymentMethods.map((method: any) => ({
    ...method,
    createdAt: method.createdAt instanceof Date
      ? method.createdAt.toISOString()
      : method.createdAt,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Methods</h1>
          <p className="text-gray-600">Manage payment options for customers</p>
        </div>
        <Link href="/dashboard/payments/methods/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </Link>
      </div>

      {/* Payment Methods List - Client Component */}
      <PaymentMethodsList paymentMethods={serializedData} />
    </div>
  );
}
