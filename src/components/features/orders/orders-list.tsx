"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Search, Eye, Filter } from "lucide-react";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { Order } from "@/types";
import { useRouter } from "next/navigation";
import orderService from "@/services/orderService";

// Type for serialized orders (dates as strings for client component)
type SerializedOrder = Omit<Order, "createdAt" | "deliveredAt"> & {
  createdAt: string;
  deliveredAt?: string;
};

interface OrdersListProps {
  orders: SerializedOrder[];
  customers: Record<string, { id: string; name: string }>;
}

export function OrdersList({ orders, customers }: OrdersListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredOrders = orders.filter((order) => {
    const customerName = customers[order.customerId]?.name || "Unknown";
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: orders.length,
    placed: orders.filter((o) => o.status === "placed").length,
    pending_confirmation: orders.filter(
      (o) => o.status === "pending_confirmation"
    ).length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!newStatus) return;

    try {
      await orderService.updateOrderStatus(orderId, newStatus as any);
      showToast("Order status updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status");
    }
  };

  return (
    <>
      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 hover:bg-gray-50"
            }`}>
            {status
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")}{" "}
            ({count})
          </button>
        ))}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search by order ID or customer name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <h3 className="text-lg font-semibold mb-2">
                        No orders found
                      </h3>
                      <p className="text-gray-600">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your search or filters"
                          : "No orders yet. Create your first order!"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const customerName =
                    customers[order.customerId]?.name || "Unknown Customer";
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell className="font-semibold">
                        Rs. {Math.floor(order.total).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge
                            className={getStatusColor(order.paymentStatus)}>
                            {order.paymentStatus.replace("_", " ")}
                          </Badge>
                          <p className="text-xs text-gray-600">
                            {order.paymentMethod.type?.replace("_", " ") ||
                              "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/orders/${order.id}`)
                            }>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Select
                            className="h-8 text-sm"
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            defaultValue="">
                            <option value="">Change Status</option>
                            <option value="placed">Placed</option>
                            <option value="pending_confirmation">
                              Pending Confirmation
                            </option>
                            <option value="confirmed">Confirmed</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default OrdersList;
