"use client";

import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Search, Eye, Filter, Edit, X } from "lucide-react";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { Order } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-context";
import orderService from "@/services/orderService";

// Type for serialized payment method
type SerializedPaymentMethod = Omit<Order["paymentMethod"], "createdAt"> & {
  createdAt: string;
};

// Type for serialized orders (dates as strings for client component)
type SerializedOrder = Omit<Order, "createdAt" | "deliveredAt" | "paymentMethod"> & {
  createdAt: string;
  deliveredAt?: string;
  paymentMethod: SerializedPaymentMethod;
};

interface OrdersListProps {
  orders: SerializedOrder[];
  customers: Record<string, { id: string; name: string; phone: string }>;
}

export function OrdersList({ orders, customers }: OrdersListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = React.useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = React.useState("all");
  const [cancelConfirmation, setCancelConfirmation] = React.useState<{
    orderId: string;
    order: SerializedOrder;
  } | null>(null);

  const filteredOrders = orders.filter((order) => {
    const customerName = customers[order.customerId]?.name || "Unknown";
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesDate =
      (!dateFrom || new Date(order.createdAt) >= new Date(dateFrom)) &&
      (!dateTo || new Date(order.createdAt) <= new Date(dateTo));
    const matchesPaymentMethod =
      paymentMethodFilter === "all" || order.paymentMethod.type === paymentMethodFilter;
    const matchesPaymentStatus =
      paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesPaymentMethod && matchesPaymentStatus;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortBy) {
      case "createdAt":
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
        break;
      case "total":
        aVal = a.total;
        bVal = b.total;
        break;
      case "customerName":
        aVal = customers[a.customerId]?.name || "";
        bVal = customers[b.customerId]?.name || "";
        break;
      default:
        aVal = new Date(a.createdAt);
        bVal = new Date(b.createdAt);
    }
    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    confirmed: orders.filter((o) => o.status === "confirmed").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    refunded: orders.filter((o) => o.status === "refunded").length,
  };


  // Business logic for order edit/cancel eligibility
  const canEditOrder = (order: SerializedOrder): boolean => {
    return order.status === 'pending';
  };

  const canCancelOrder = (order: SerializedOrder): boolean => {
    return order.status === 'pending';
  };

  const handleEditOrder = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}/edit`);
  };

  const handleCancelOrder = (order: SerializedOrder) => {
    setCancelConfirmation({ orderId: order.id, order });
  };

  const confirmCancelOrder = async () => {
    if (!cancelConfirmation) return;

    try {
      await orderService.cancelOrder(cancelConfirmation.orderId);
      showToast("success", "Order cancelled successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("error", "Failed to cancel order", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setCancelConfirmation(null);
    }
  };

  const cancelCancelOrder = () => {
    setCancelConfirmation(null);
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

      {/* Filters and Sorting */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date From */}
            <div className="flex flex-col">
              <Label htmlFor="dateFrom" className="mb-2">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            {/* Date To */}
            <div className="flex flex-col">
              <Label htmlFor="dateTo" className="mb-2">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            {/* Payment Method Filter */}
            <div className="flex flex-col">
              <Label htmlFor="paymentMethodFilter" className="mb-2">Payment Method</Label>
              <Select
                id="paymentMethodFilter"
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="jazzcash">JazzCash</option>
                <option value="bank_transfer">Bank Transfer</option>
              </Select>
            </div>
            {/* Payment Status Filter */}
            <div className="flex flex-col">
              <Label htmlFor="paymentStatusFilter" className="mb-2">Payment Status</Label>
              <Select
                id="paymentStatusFilter"
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="awaiting_confirmation">Awaiting Confirmation</option>
                <option value="confirmed">Confirmed</option>
                <option value="refunded">Refunded</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
            {/* Sort By */}
            <div className="flex flex-col">
              <Label htmlFor="sortBy" className="mb-2">Sort By</Label>
              <Select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt">Date</option>
                <option value="total">Total</option>
                <option value="customerName">Customer Name</option>
              </Select>
            </div>
            {/* Sort Order */}
            <div className="flex flex-col">
              <Label htmlFor="sortOrder" className="mb-2">Order</Label>
              <Select
                id="sortOrder"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="p-0 px-2 py-3">Order ID</TableHead>
                <TableHead className="p-0 px-2 py-3">Customer</TableHead>
                <TableHead className="p-0 px-2 py-3">Phone</TableHead>
                <TableHead className="p-0 px-2 py-3">Items</TableHead>
                <TableHead className="p-0 px-2 py-3">Total</TableHead>
                <TableHead className="p-0 px-2 py-3">Payment Method</TableHead>
                <TableHead className="p-0 px-2 py-3 text-center">Payment Status</TableHead>
                <TableHead className="p-0 px-2 py-3 text-center">Order Status</TableHead>
                <TableHead className="p-0 px-2 py-3">Date</TableHead>
                <TableHead className="p-0 px-2 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="p-0 px-2 py-3 text-center py-8">
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
                sortedOrders.map((order) => {
                   const customerName =
                     customers[order.customerId]?.name || "Unknown Customer";
                   const customerPhone =
                     customers[order.customerId]?.phone || "N/A";
                   return (
                     <TableRow key={order.id}>
                      <TableCell className="p-0 px-2 py-3 font-medium text-xs">{order.id}</TableCell>
                      <TableCell className="p-0 px-2 py-3 text-xs">{customerName}</TableCell>
                      <TableCell className="p-0 px-2 py-3 text-xs">{customerPhone}</TableCell>
                      <TableCell className="p-0 px-2 py-3 text-xs">{order.items.length} items</TableCell>
                      <TableCell className="p-0 px-2 py-3 font-semibold text-xs">
                        Rs. {Math.floor(order.total).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-0 px-2 py-3 text-xs">
                        {order.paymentMethod.type?.replace(/_/g, " ") || "N/A"}
                      </TableCell>
                      <TableCell className="p-0 px-2 py-3 text-center">
                        <Badge className={`${getStatusColor(order.paymentStatus)} text-xs px-2 py-1`}>
                          {order.paymentStatus.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-0 px-2 py-3 text-center">
                        <Badge className={`${getStatusColor(order.status)} text-xs px-2 py-1`}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-0 px-2 py-3 text-xs text-gray-600">
                        {formatDateTime(order.createdAt)}
                      </TableCell>
                      <TableCell className="p-0 px-2 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-12 p-1"
                            onClick={() =>
                              router.push(`/dashboard/orders/${order.id}`)
                            }>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEditOrder(order) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-12 p-1 text-blue-600 hover:text-blue-700"
                              onClick={() => handleEditOrder(order.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canCancelOrder(order) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-12 p-1 text-red-600 hover:text-red-700"
                              onClick={() => handleCancelOrder(order)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Custom Cancel Confirmation Dialog */}
      {cancelConfirmation && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel order <strong>{cancelConfirmation.order.id}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelCancelOrder}
                disabled={false}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelOrder}
                disabled={false}>
                Yes, Cancel Order
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default OrdersList;
