"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSearchDropdown } from "@/components/features/customers/customer-search-dropdown";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { ArrowLeft, Save, Loader2, Trash2, ShoppingCart, Upload } from "lucide-react";
import Link from "next/link";
import orderService from "@/services/orderService";
import discountService from "@/services/discountService";
import { productService } from "@/services/productService";
import { getBatchesByProductId } from "@/helpers/firestore_helper_functions/batches/get_methods/getBatchFromProductIdFromDB";
import { useToast } from "@/components/ui/toast-context";
import type {
  PaymentMethod,
  OrderItem,
  Discount,
  CustomerSearchResult,
  Order,
} from "@/types";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/../firebaseConfig";

interface ProductWithStock {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  isAvailableForOrder: boolean;
  // Additional fields for fetched products
  batchId?: string;
  discountAmount?: number;
  finalPrice?: number;
}

interface OrderItemWithDetails extends OrderItem {
  image: string;
  availableStock: number;
}

interface OrderEditFormProps {
  order: Order;
  customers: CustomerSearchResult[];
  products: ProductWithStock[];
  paymentMethods: PaymentMethod[];
}

export function OrderEditForm({
  order,
  customers,
  products,
  paymentMethods,
}: OrderEditFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    order.customerId
  );
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState(order.deliveryAddress);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<string>(order.paymentMethod.id);
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [existingProofOfPaymentUrl, setExistingProofOfPaymentUrl] = useState<string | undefined>(order.proofOfPaymentUrl);

  console.log('OrderEditForm - order.paymentMethod:', order.paymentMethod);
  console.log('OrderEditForm - selectedPaymentMethodId:', selectedPaymentMethodId);
  console.log('OrderEditForm - paymentMethods:', paymentMethods);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [bestOrderDiscount, setBestOrderDiscount] = useState<Discount | null>(
    null
  );

  // Initialize order items from existing order
  useEffect(() => {
    const initializeOrderItems = async () => {
      const itemsWithDetails: OrderItemWithDetails[] = [];

      for (const item of order.items) {
        // Find product details
        const product = products.find(p => p.id === item.productId);
        if (product) {
          // Fetch actual stock from batches
          try {
            const batches = await getBatchesByProductId(item.productId);
            const totalStock = batches
              .filter((b: any) => b.remainingQuantity > 0)
              .reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

            // Calculate available stock (total stock + current order quantity since it's already deducted)
            const availableStock = totalStock + item.quantity;

            itemsWithDetails.push({
              ...item,
              image: product.image,
              availableStock: availableStock,
            });
          } catch (error) {
            console.error(`Error fetching stock for ${item.productId}:`, error);
            // Fallback to product stock if batch fetch fails
            const availableStock = (product.stock || 0) + item.quantity;
            itemsWithDetails.push({
              ...item,
              image: product.image,
              availableStock: availableStock,
            });
          }
        }
      }

      setOrderItems(itemsWithDetails);
    };

    initializeOrderItems();
  }, [order, products]);

  // Effect to calculate best order-level discount when order items or subtotal changes
  useEffect(() => {
    const calculateBestDiscount = async () => {
      // Calculate subtotal from order items
      const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

      if (subtotal === 0) {
        setBestOrderDiscount(null);
        return;
      }

      try {
        const bestDiscount =
          await discountService.getBestActiveOrderLevelDiscount(subtotal);
        setBestOrderDiscount(bestDiscount);
      } catch (error) {
        console.error("Error fetching best order discount:", error);
        setBestOrderDiscount(null);
      }
    };

    calculateBestDiscount();
  }, [orderItems]); // Recalculate when order items change

  // Calculate pricing
  const calculatePricing = () => {
    // Calculate subtotal
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate discounts
    let totalDiscount = 0;

    // Apply product-level discounts (already calculated in item.discount)
    orderItems.forEach((item) => {
      if (item.discount > 0) {
        totalDiscount += item.discount * item.quantity;
      }
    });

    // Apply best order-level discount (if available)
    if (bestOrderDiscount) {
      const orderDiscount = (subtotal * bestOrderDiscount.value) / 100;
      totalDiscount += orderDiscount;
    }

    const deliveryFee = 0; // Will be handled later
    const total = subtotal - totalDiscount + deliveryFee;

    return {
      subtotal,
      discount: totalDiscount,
      deliveryFee,
      total: Math.max(0, total),
      orderLevelDiscount: bestOrderDiscount,
    };
  };

  const pricing = calculatePricing();

  const handleProductSelect = async (product: { id: string; name: string; image: string }) => {
    console.log('Edit form handleProductSelect called for product:', product);

    // Always fetch fresh product data to get accurate stock
    let fullProduct;
    try {
      console.log('Edit form - Fetching product data for:', product.id);
      const productData = await productService.getById(product.id);
      console.log('Edit form - Fetched productData:', productData);
      if (productData) {
        // Calculate discount for the fetched product
        const highestDiscountPercentage =
          await productService.getHighestActiveDiscountPercentageByProductId(
            product.id
          );

        // Get batch data for pricing
        const batches = await getBatchesByProductId(product.id);
        console.log('Edit form - Fetched batches from DB:', batches);
        const activeBatches = batches.filter((b: any) => b.remainingQuantity > 0);
        console.log('Edit form - Active batches:', activeBatches);
        let totalStock = activeBatches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);

        // If this product was originally in the order, add back the original quantity
        // since it was deducted when the order was created
        const originalOrderItem = order.items.find(item => item.productId === product.id);
        if (originalOrderItem) {
          totalStock += originalOrderItem.quantity;
          console.log('Edit form - Added back original order quantity:', originalOrderItem.quantity, 'New total stock:', totalStock);
        }

        console.log('Edit form - Total stock calculated:', totalStock);

        // Use the first active batch for pricing
        const firstActiveBatch = activeBatches[0];

        const price = firstActiveBatch?.price || 0;
        const discountAmount = (price * highestDiscountPercentage) / 100;

        fullProduct = {
          id: productData.id,
          name: productData.info.name,
          image: productData.multimedia?.images?.[0] || "",
          price: price,
          stock: totalStock,
          isAvailableForOrder: totalStock > 0,
          // Store additional data for order item construction
          batchId: firstActiveBatch?.id || "",
          discountAmount: discountAmount,
          finalPrice: price - discountAmount,
        };
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      showToast("error", "Failed to load product details");
      return;
    }

    if (!fullProduct) {
      setTimeout(() => showToast("error", "Product not found"), 0);
      return;
    }

    // Check if product is available for ordering
    if (!fullProduct.isAvailableForOrder) {
      setTimeout(() => showToast("warning", "Product Unavailable", "This product is currently out of stock or unavailable for ordering."), 0);
      return;
    }

    // Check if product already added
    const existingItem = orderItems.find(
      (item) => item.productId === fullProduct.id
    );

    if (existingItem) {
      // Increase quantity if already added
      handleQuantityChange(fullProduct.id, existingItem.quantity + 1);
      return;
    }

    // Use pricing data from product (either pre-loaded or fetched)
    const discount = fullProduct.discountAmount || 0;
    const finalPrice = fullProduct.finalPrice || fullProduct.price;

    const newItem: OrderItemWithDetails = {
      productId: fullProduct.id,
      productName: fullProduct.name,
      quantity: 1,
      unitPrice: fullProduct.price,
      discount: discount,
      subtotal: finalPrice,
      batchId: fullProduct.batchId || "",
      image: fullProduct.image,
      availableStock: fullProduct.stock,
    };

    setOrderItems([...orderItems, newItem]);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setOrderItems((items) =>
      items.map((item) => {
        if (item.productId === productId) {
          // Check stock
          if (newQuantity > item.availableStock) {
            setTimeout(() => showToast("warning", "Stock Limit Exceeded", `Only ${item.availableStock} units available in stock`), 0);
            return item;
          }

          const finalPrice = item.unitPrice - item.discount;
          return {
            ...item,
            quantity: newQuantity,
            subtotal: finalPrice * newQuantity,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((items) =>
      items.filter((item) => item.productId !== productId)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedCustomerId) {
      setError("Please select a customer");
      return;
    }

    if (orderItems.length === 0) {
      setError("Please add at least one product to the order");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Please enter delivery address");
      return;
    }

    if (!selectedPaymentMethodId) {
      setError("Please select a payment method");
      return;
    }

    // Check if proof of payment is required
    const selectedPaymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethodId);
    const requiresProofOfPayment = selectedPaymentMethod &&
      ["easypaisa", "jazzcash", "bank_transfer"].includes(selectedPaymentMethod.type || "");

    if (requiresProofOfPayment && !proofOfPaymentFile && !existingProofOfPaymentUrl) {
      setError("Please upload proof of payment for online payment methods");
      return;
    }

    setLoading(true);

    try {
      // Upload proof of payment if provided, otherwise keep existing
      let proofOfPaymentUrl: string | undefined = existingProofOfPaymentUrl;
      if (proofOfPaymentFile) {
        const timestamp = Date.now();
        const storagePath = `ORDERS/proof-of-payment/${timestamp}-${proofOfPaymentFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, proofOfPaymentFile);
        proofOfPaymentUrl = await getDownloadURL(storageRef);
      }

      const selectedPaymentMethod = paymentMethods.find(
        (pm) => pm.id === selectedPaymentMethodId
      );

      if (!selectedPaymentMethod) {
        throw new Error("Invalid payment method");
      }

      // Prepare updated order data
      const updatedOrderData = {
        customerId: selectedCustomerId,
        items: orderItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          batchId: item.batchId,
        })),
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        deliveryFee: pricing.deliveryFee,
        total: pricing.total,
        paymentMethod: selectedPaymentMethod,
        deliveryAddress: deliveryAddress.trim(),
        proofOfPaymentUrl,
      };

      await orderService.updateOrder(order.id, updatedOrderData);

      setTimeout(() => showToast("success", "Order updated successfully!"), 0);
      router.push("/dashboard/orders");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating order:", error);
      setError(error.message || "Failed to update order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Order</h1>
            <p className="text-gray-500 mt-1">
              Update order details for {order.id}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Order
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>
                    Select Customer <span className="text-red-500">*</span>
                  </Label>
                  <CustomerSearchDropdown
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    onSelect={setSelectedCustomerId}
                    onClear={() => setSelectedCustomerId(null)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Product */}
                <div className="space-y-2">
                  <Label>Add Products</Label>
                  <ProductSearchDropdown
                    selectedProductId=""
                    onSelect={handleProductSelect}
                    searchValue={productSearchValue}
                    onSearchChange={setProductSearchValue}
                    placeholder="Search for products to add..."
                  />
                </div>

                {/* Order Items List */}
                {orderItems.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {orderItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        {/* Product Image */}
                        {item.image ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            <Image
                              src={item.image}
                              alt={item.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="h-8 w-8 text-gray-400" />
                          </div>
                        )}

                        {/* Product Details */}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.productName}
                          </h4>
                          <div className="flex gap-3 mt-1 text-sm text-gray-600">
                            <span>
                              Price: Rs.{" "}
                              {Math.floor(item.unitPrice).toLocaleString()}
                            </span>
                            {item.discount > 0 && (
                              <span className="text-green-600 font-medium">
                                Discount: Rs.{" "}
                                {Math.floor(item.discount).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {item.discount > 0 && (
                            <p className="text-xs text-green-600 mt-0.5">
                              ✓ Final Price: Rs.{" "}
                              {Math.floor(
                                item.unitPrice - item.discount
                              ).toLocaleString()}{" "}
                              per unit
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Stock: {item.availableStock} units
                          </p>
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity - 1
                              )
                            }
                            disabled={item.quantity <= 1}>
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value)) {
                                handleQuantityChange(item.productId, value);
                              }
                            }}
                            min="1"
                            max={item.availableStock}
                            className="w-20 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleQuantityChange(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            disabled={item.quantity >= item.availableStock}>
                            +
                          </Button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right min-w-[100px]">
                          <p className="font-semibold text-gray-900">
                            Rs. {Math.floor(item.subtotal).toLocaleString()}
                          </p>
                        </div>

                        {/* Remove */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    No products added yet. Search and add products above.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">
                    Delivery Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={
                      selectedCustomer?.address ||
                      "Enter complete delivery address"
                    }
                    rows={3}
                    disabled={loading}
                  />
                  {selectedCustomer?.address && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDeliveryAddress(selectedCustomer.address || "")
                      }>
                      Use Customer's Default Address
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Payment */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    Rs. {Math.floor(pricing.subtotal).toLocaleString()}
                  </span>
                </div>
                {pricing.discount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">
                        - Rs. {Math.floor(pricing.discount).toLocaleString()}
                      </span>
                    </div>
                    {/* Show discount breakdown */}
                    <div className="text-xs text-gray-500 pl-2">
                      {orderItems.some((item) => item.discount > 0) && (
                        <div>• Product/Category discounts applied</div>
                      )}
                      {pricing.orderLevelDiscount && (
                        <div>
                          • {pricing.orderLevelDiscount.name} (
                          {pricing.orderLevelDiscount.value}%)
                          {pricing.orderLevelDiscount.minPurchaseAmount &&
                            pricing.orderLevelDiscount.minPurchaseAmount >
                              0 && (
                              <span className="text-gray-400">
                                {" "}
                                - Min: Rs.{" "}
                                {Math.floor(
                                  pricing.orderLevelDiscount.minPurchaseAmount
                                ).toLocaleString()}
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-medium">
                    Rs. {Math.floor(pricing.deliveryFee).toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-lg text-blue-600">
                    Rs. {Math.floor(pricing.total).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">
                    Select Payment Method{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="paymentMethod"
                    value={selectedPaymentMethodId}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    disabled={loading}
                    className="capitalize">
                    <option value="">Choose payment method</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.type?.replace(/_/g, " ") || "Unknown"}
                        {!pm.isActive && " (Inactive)"}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Proof of Payment - Only show for online payments */}
            {selectedPaymentMethodId && ["easypaisa", "jazzcash", "bank_transfer"].includes(
              paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.type || ""
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Proof of Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Existing Proof of Payment */}
                    {existingProofOfPaymentUrl && (
                      <div className="space-y-2">
                        <Label>Current Proof of Payment</Label>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <Image
                            src={existingProofOfPaymentUrl}
                            alt="Proof of Payment"
                            width={200}
                            height={200}
                            className="rounded-lg object-cover max-w-full h-auto"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            This is the proof of payment uploaded during order creation.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="proofOfPayment">
                        {existingProofOfPaymentUrl ? "Update Proof of Payment" : "Upload Proof of Payment"} <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="proofOfPayment"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofOfPaymentFile(e.target.files?.[0] || null)}
                          disabled={loading}
                          className="flex-1"
                        />
                        <Upload className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500">
                        {existingProofOfPaymentUrl
                          ? "Upload a new image to replace the current proof of payment"
                          : "Upload an image of your payment receipt or transaction confirmation"
                        }
                      </p>
                      {proofOfPaymentFile && (
                        <p className="text-sm text-green-600">
                          Selected: {proofOfPaymentFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-blue-600">Pending</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className="font-medium text-yellow-600">
                    {selectedPaymentMethodId &&
                    ["easypaisa", "jazzcash", "bank_transfer"].includes(
                      paymentMethods.find(
                        (pm) => pm.id === selectedPaymentMethodId
                      )?.type || ""
                    )
                      ? "Awaiting Confirmation"
                      : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Items</span>
                  <span className="font-medium">{orderItems.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}