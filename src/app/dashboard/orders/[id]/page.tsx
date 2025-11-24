'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import orderService from "@/services/orderService";
import customerService from "@/services/customerService";
import OrderDetail from "@/components/features/orders/order-detail";
import { Order } from "@/types";
import { Loader2 } from "lucide-react";
import { safeSerializeForClient } from "@/lib/firestore-utils";

// Type for serialized order (dates as strings for client component)
type SerializedOrder = Omit<Order, "createdAt" | "deliveredAt"> & {
  createdAt: string;
  deliveredAt?: string;
  paymentMethod: Omit<Order["paymentMethod"], "createdAt"> & {
    createdAt: string;
  };
};

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderData = await orderService.getOrderById(id);
        if (!orderData) {
          setError("Order not found");
          return;
        }
        setOrder(orderData);

        const customerData = await customerService.getCustomerById(orderData.customerId);
        setCustomer(customerData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center">
        Order not found
      </div>
    );
  }

  // Serialize data for client component
  const serializedOrder = safeSerializeForClient(order) as any;

  return (
    <OrderDetail
      order={serializedOrder}
      customer={customer}
    />
  );
}