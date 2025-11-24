"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Edit, X } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { Order, Customer } from "@/types";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-context";
import orderService from "@/services/orderService";
import { productService } from "@/services/productService";
import Image from "next/image";
import { useEffect, useState } from "react";

// Type for serialized order (dates as strings for client component)
type SerializedOrder = Omit<Order, "createdAt" | "deliveredAt"> & {
  createdAt: string;
  deliveredAt?: string;
  paymentMethod: Omit<Order["paymentMethod"], "createdAt"> & {
    createdAt: string;
  };
  proofOfPaymentUrl?: string;
};

interface OrderDetailProps {
  order: SerializedOrder;
  customer: Customer | null;
}

export function OrderDetail({ order, customer }: OrderDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProductImages = async () => {
      const images: Record<string, string> = {};
      for (const item of order.items) {
        if (item.productId && !images[item.productId]) {
          try {
            const product = await productService.getById(item.productId);
            images[item.productId] = product?.multimedia?.images?.[0] || "";
          } catch (error) {
            console.error(`Error fetching product ${item.productId}:`, error);
          }
        }
      }
      setProductImages(images);
    };

    if (order.items.length > 0) {
      fetchProductImages();
    }
  }, [order.items]);

  // Business logic for order edit/cancel eligibility
  const canEditOrder = (): boolean => {
    return order.status === 'pending' && order.paymentMethod.type === 'cash_on_delivery';
  };

  const canCancelOrder = (): boolean => {
    return order.status === 'pending' && order.paymentMethod.type === 'cash_on_delivery';
  };

  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleCancelOrder = () => {
    setShowCancelConfirmation(true);
  };

  const confirmCancelOrder = async () => {
    try {
      await orderService.cancelOrder(order.id);
      showToast("success", "Order cancelled successfully!");
      router.push("/dashboard/orders");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling order:", error);
      showToast("error", "Failed to cancel order", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setShowCancelConfirmation(false);
    }
  };

  const cancelCancelOrder = () => {
    setShowCancelConfirmation(false);
  };

  const handleOrderStatusChange = async (newStatus: string) => {
    if (!newStatus || newStatus === order.status) return;

    setUpdatingStatus(true);
    try {
      await orderService.updateOrderStatus(order.id, newStatus as any);
      showToast("success", "Order status updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating order status:", error);
      showToast("error", "Failed to update order status", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!newStatus || newStatus === order.paymentStatus) return;

    setUpdatingStatus(true);
    try {
      await orderService.updatePaymentStatus(order.id, newStatus as any);
      showToast("success", "Payment status updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error updating payment status:", error);
      showToast("error", "Failed to update payment status", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Order Details</h1>
            <p className="text-gray-500 mt-1">Order ID: {order.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEditOrder() && (
            <Link href={`/dashboard/orders/${order.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            </Link>
          )}
          {canCancelOrder() && (
            <Button variant="outline" onClick={handleCancelOrder} className="text-red-600 hover:text-red-700">
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {customer?.name || "Unknown"}</p>
                <p><strong>Phone:</strong> {customer?.phone || "N/A"}</p>
                <p><strong>Address:</strong> {order.deliveryAddress}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {productImages[item.productId] ? (
                        <Image
                          src={productImages[item.productId]}
                          alt={item.productName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Quantity: {item.quantity}</p>
                        <p>Unit Price: Rs. {Math.floor(item.unitPrice).toLocaleString()}</p>
                        {item.discount > 0 && (
                          <p>Discount: Rs. {Math.floor(item.discount).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rs. {Math.floor(item.subtotal).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Status */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rs. {Math.floor(order.subtotal).toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-green-600">- Rs. {Math.floor(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-medium">Rs. {Math.floor(order.deliveryFee).toLocaleString()}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-bold text-lg text-blue-600">Rs. {Math.floor(order.total).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status</span>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Status</span>
                <Badge className={getStatusColor(order.paymentStatus)}>
                  {order.paymentStatus.replace("_", " ")}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="font-medium">{order.paymentMethod.type?.replace(/_/g, " ") || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Created</span>
                <span className="text-sm">{formatDateTime(order.createdAt)}</span>
              </div>
              {order.deliveredAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivered</span>
                  <span className="text-sm">{formatDateTime(order.deliveredAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orderStatus">Order Status</Label>
                  <Select
                    id="orderStatus"
                    value={order.status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleOrderStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <Select
                    id="paymentStatus"
                    value={order.paymentStatus}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handlePaymentStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full">
                    <option value="pending">Pending</option>
                    <option value="awaiting_confirmation">Awaiting Confirmation</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="refunded">Refunded</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
              {updatingStatus && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Updating status...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proof of Payment - Only show for online payments */}
          {order.proofOfPaymentUrl && ["easypaisa", "jazzcash", "bank_transfer"].includes(order.paymentMethod.type || "") && (
            <Card>
              <CardHeader>
                <CardTitle>Proof of Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Image
                      src={order.proofOfPaymentUrl}
                      alt="Proof of Payment"
                      width={400}
                      height={300}
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/default-image.svg";
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    Payment receipt uploaded by customer
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Custom Cancel Confirmation Dialog */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Cancel Order</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel order <strong>{order.id}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelCancelOrder}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmCancelOrder}>
                Yes, Cancel Order
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;