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
} from "@/types";
import Image from "next/image";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/../firebaseConfig";

interface OrderItemWithDetails extends OrderItem {
  image: string;
  availableStock: number;
}

interface OrderCreateFormProps {
  customers: CustomerSearchResult[];
  paymentMethods: PaymentMethod[];
}

export function OrderCreateForm({
  customers,
  paymentMethods,
}: OrderCreateFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null
  );
  const [orderItems, setOrderItems] = useState<OrderItemWithDetails[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] =
    useState<string>("");
  const [productSearchValue, setProductSearchValue] = useState("");
  const [bestOrderDiscount, setBestOrderDiscount] = useState<Discount | null>(
    null
  );
  const [quantityInputValues, setQuantityInputValues] = useState<Record<string, string>>({});
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);

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
    console.log('handleProductSelect called for product:', product);

    // Fetch product details and batches
    try {
      const productData = await productService.getById(product.id);
      console.log('Fetched productData:', productData);

      if (!productData) {
        setTimeout(() => showToast("error", "Product not found"), 0);
        return;
      }

      // Calculate discount for the fetched product
      const highestDiscountPercentage =
        await productService.getHighestActiveDiscountPercentageByProductId(
          product.id
        );

      // Get batch data for pricing
      const batches = await getBatchesByProductId(product.id);
      console.log('Fetched batches from DB:', batches);

      const activeBatches = batches.filter((b: any) => b.remainingQuantity > 0);
      console.log('Active batches:', activeBatches);

      // Sum all remaining quantities for total stock
      const totalStock = activeBatches.reduce((sum, b) => sum + (b.remainingQuantity || 0), 0);
      console.log('Total stock calculated:', totalStock);

      // Use the product price for pricing
      const price = productData.price;
      const discountAmount = (price * highestDiscountPercentage) / 100;

      const isAvailable = totalStock > 0;

      if (!isAvailable) {
        setTimeout(() => showToast("warning", "Product Unavailable", "This product is currently out of stock."), 0);
        return;
      }

    // Check if product already added
    const existingItem = orderItems.find(
      (item) => item.productId === product.id
    );

    if (existingItem) {
      // Increase quantity if already added
      setTimeout(() => handleQuantityChange(product.id, existingItem.quantity + 1), 0);
      return;
    }

      // Select the first active batch for the order item
      const firstActiveBatch = activeBatches[0];

      // Create order item with basic data
      const newItem: OrderItemWithDetails = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: price - discountAmount,
        discount: discountAmount,
        subtotal: (price - discountAmount),
        batchId: firstActiveBatch?.id || "",
        image: product.image,
        availableStock: totalStock,
      };

      setOrderItems([...orderItems, newItem]);
      setQuantityInputValues(prev => ({ ...prev, [product.id]: "1" }));
    } catch (error) {
      console.error('Error fetching product data:', error);
      setTimeout(() => showToast("error", "Failed to load product details"), 0);
    }
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
          const updatedItem = {
            ...item,
            quantity: newQuantity,
            subtotal: finalPrice * newQuantity,
          };
          // Update input value
          setQuantityInputValues(prev => ({ ...prev, [productId]: newQuantity.toString() }));
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((items) =>
      items.filter((item) => item.productId !== productId)
    );
    setQuantityInputValues(prev => {
      const newValues = { ...prev };
      delete newValues[productId];
      return newValues;
    });
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

    // Check if proof of payment is required for non-COD payments
    const isNonCod = selectedPaymentMethodId && ["easypaisa", "jazzcash", "bank_transfer"].includes(
      paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.type || ""
    );
    if (isNonCod && !proofOfPaymentFile) {
      setError("Please upload proof of payment for online payments");
      return;
    }

    setLoading(true);

    try {
      // Upload proof of payment if provided
      let proofOfPaymentUrl: string | undefined;
      if (proofOfPaymentFile) {
        const timestamp = Date.now();
        const storagePath = `ORDERS/proof-of-payment/${timestamp}-${proofOfPaymentFile.name}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, proofOfPaymentFile);
        proofOfPaymentUrl = await getDownloadURL(storageRef);
      }

      // Create payment method object based on selected ID
      let selectedPaymentMethod: any;
      if (selectedPaymentMethodId === "cod") {
        selectedPaymentMethod = {
          id: "cod",
          type: "cash_on_delivery" as const,
          isActive: true,
          displayOrder: 1,
          createdAt: new Date(),
        };
      } else if (selectedPaymentMethodId === "easypaisa") {
        selectedPaymentMethod = {
          id: "easypaisa",
          type: "easypaisa" as const,
          isActive: true,
          displayOrder: 2,
          createdAt: new Date(),
        };
      } else if (selectedPaymentMethodId === "jazzcash") {
        selectedPaymentMethod = {
          id: "jazzcash",
          type: "jazzcash" as const,
          isActive: true,
          displayOrder: 3,
          createdAt: new Date(),
        };
      } else if (selectedPaymentMethodId === "bank_transfer") {
        selectedPaymentMethod = {
          id: "bank_transfer",
          type: "bank_transfer" as const,
          isActive: true,
          displayOrder: 4,
          createdAt: new Date(),
        };
      } else {
        throw new Error("Invalid payment method");
      }

      // Determine payment status based on payment method type
      let paymentStatus: "pending" | "awaiting_confirmation" = "pending";
      if (
        ["easypaisa", "jazzcash", "bank_transfer"].includes(
          selectedPaymentMethod.type
        )
      ) {
        paymentStatus = "awaiting_confirmation";
      }

      const now = new Date();

      const orderData = {
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
        paymentStatus,
        paymentStatusHistory: [
          {
            status: paymentStatus,
            updatedAt: now,
          },
        ],
        deliveryAddress: deliveryAddress.trim(),
        status: "pending" as const,
        statusHistory: [
          {
            status: "pending" as const,
            updatedAt: now,
          },
        ],
        proofOfPaymentUrl,
        createdAt: now,
      };

      await orderService.createOrder(orderData);
      setTimeout(() => showToast("success", "Order created successfully!"), 0);
      router.push("/dashboard/orders");
      router.refresh();
    } catch (error: any) {
      console.error("Error creating order:", error);
      setError(error.message || "Failed to create order. Please try again.");
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
            <h1 className="text-3xl font-bold">Create New Order</h1>
            <p className="text-gray-500 mt-1">Add a new order for a customer</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Order
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
                            value={quantityInputValues[item.productId] ?? item.quantity.toString()}
                            onChange={(e) => {
                              const value = e.target.value;
                              setQuantityInputValues(prev => ({ ...prev, [item.productId]: value }));
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                handleQuantityChange(item.productId, numValue);
                              }
                            }}
                            onBlur={() => {
                              // Reset to actual quantity if invalid
                              const currentValue = quantityInputValues[item.productId];
                              if (currentValue && isNaN(parseInt(currentValue))) {
                                setQuantityInputValues(prev => ({ ...prev, [item.productId]: item.quantity.toString() }));
                              }
                            }}
                            min="1"
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
                        {pm.type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Proof of Payment - Only show for non-COD payments */}
            {selectedPaymentMethodId && ["easypaisa", "jazzcash", "bank_transfer"].includes(
              paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.type || ""
            ) && (
              <Card>
                <CardHeader>
                  <CardTitle>Proof of Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="proofOfPayment">
                      Upload Proof of Payment <span className="text-red-500">*</span>
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
                      Upload an image of your payment receipt or transaction confirmation
                    </p>
                    {proofOfPaymentFile && (
                      <p className="text-sm text-green-600">
                        Selected: {proofOfPaymentFile.name}
                      </p>
                    )}
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
                      ? "Pending Confirmation"
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
