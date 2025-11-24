// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import customerService from "@/services/customerService";
import paymentMethodService from "@/services/paymentMethodService";
import { productService } from "@/services/productService";
import { OrderCreateForm } from "@/components/features/orders/order-create-form";

export default async function CreateOrderPage() {
  try {
    // Fetch basic data on the server - avoid product fetching to prevent stack overflow
    const customers = await customerService.getAllCustomersForSearch({ isActive: true });

    // Use hardcoded payment methods as per admin order flow spec
    const paymentMethods = [
      { id: "cod", type: "cash_on_delivery", isActive: true },
      { id: "easypaisa", type: "easypaisa", isActive: true },
      { id: "jazzcash", type: "jazzcash", isActive: true },
      { id: "bank_transfer", type: "bank_transfer", isActive: true },
    ];

    // Create safe, minimal payloads for the client component to avoid
    // deep serialization or circular references that can cause stack overflows.
    const serializedCustomers = customers.map((c: any) => ({
      id: c.id,
      name: c.name || "",
      phone: c.phone || "",
      address: c.address || "",
    }));

    const serializedPaymentMethods = paymentMethods.map((pm: any) => ({
      id: pm.id,
      type: pm.type,
      isActive: !!pm.isActive,
    }));

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <OrderCreateForm
          customers={serializedCustomers}
          paymentMethods={serializedPaymentMethods as any}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error loading order create page:", error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error Loading Page</h3>
          <p>There was an error loading the order creation page. Please try refreshing.</p>
        </div>
      </div>
    );
  }
}
