// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import orderService from "@/services/orderService";
import customerService from "@/services/customerService";
import OrdersList from "@/components/features/orders/orders-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Order } from "@/types";

export default async function OrdersPage() {
  // Fetch orders from Firestore
  const orders = await orderService.getAllOrders();

  // Fetch all customers to map customer IDs to names
  const customers = await customerService.getAllCustomers();
  const customerMap = customers.reduce(
    (acc, customer) => {
      acc[customer.id] = customer;
      return acc;
    },
    {} as Record<string, any>
  );

  // Serialize data for client component
  const serializedOrders = orders.map((order: Order) => ({
    ...order,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString(),
    paymentMethod: {
      ...order.paymentMethod,
      createdAt: typeof order.paymentMethod.createdAt === 'string'
        ? order.paymentMethod.createdAt
        : order.paymentMethod.createdAt?.toISOString?.() || new Date().toISOString(),
    },
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage and track customer orders
          </p>
        </div>
        <Link href="/dashboard/orders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

      {/* Orders List */}
      <OrdersList orders={serializedOrders} customers={customerMap} />
    </div>
  );
}
