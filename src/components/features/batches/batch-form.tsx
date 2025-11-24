"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  ArrowLeft,
  Scan,
  Package,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  FileText,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import batchService from "@/services/batchService";
import { useToast } from "@/components/ui/toast-context";
import { Batch, Product } from "@/types";
import { useSymbologyScanner } from "@use-symbology-scanner/react";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { getBatchByBatchId } from "@/helpers/firestore_helper_functions/batches/get_methods/getBatchByBatchIdFromDB";
import { createBatch } from "@/helpers/firestore_helper_functions/batches/add_methods/createBatchInDB";

interface BatchFormProps {
  products?: Product[];
}

export function BatchForm({ products }: BatchFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [scannerActive, setScannerActive] = useState(false);

  const [formData, setFormData] = useState({
    batchId: "",
    productId: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: "",
    price: "",
    supplier: "",
    location: "",
    notes: "",
  });

  // Barcode scanner - only in add mode
  // const handleSymbol = (symbol: string, matchedSymbologies: string[]) => {
  //   console.log("Scanned symbol:", symbol, "Symbologies:", matchedSymbologies);
  //   handleInputChange("batchId", symbol);
  //   setScannerActive(true);

  //   // Show feedback (optional: add beep sound)
  //   const audio = new Audio("/sounds/beep.mp3");
  //   audio.play().catch(() => {});

  //   // Flash effect - reset active state after 1 second
  //   setTimeout(() => setScannerActive(false), 1000);
  // };

  // Use barcode scanner
  // useSymbologyScanner(handleSymbol);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProductSelect = (product: { id: string; name: string; image: string }) => {
    handleInputChange("productId", product.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.batchId.trim()) {
      showToast("error", "Please enter or scan a batch ID");
      return;
    }

    if (!formData.productId) {
      showToast("error", "Please select a product");
      return;
    }

    if (!formData.manufacturingDate || !formData.expiryDate) {
      showToast("error", "Please enter manufacturing and expiry dates");
      return;
    }

    const mfgDate = new Date(formData.manufacturingDate);
    const expDate = new Date(formData.expiryDate);

    if (expDate <= mfgDate) {
      showToast("error", "Expiry date must be after manufacturing date");
      return;
    }

    // Parse numeric fields here (allowing empty input while typing)
    const quantityNum = Number(formData.quantity);
    const priceNum = Number(formData.price);

    if (!quantityNum || quantityNum <= 0) {
      showToast("error", "Please enter a valid quantity");
      return;
    }

    if (!priceNum || priceNum <= 0) {
      showToast("error", "Please enter a valid price");
      return;
    }

    setLoading(true);

    try {
      // Check if batch ID already exists (only for new batches)
      const existingBatch = await getBatchByBatchId(
        formData.batchId
      );
      if (existingBatch) {
        showToast("error", "A batch with this ID already exists");
        setLoading(false);
        return;
      }

      // Create new batch
      const batchData: Omit<Batch, "id"> = {
        batchId: formData.batchId.trim(),
        productId: formData.productId,
        manufacturingDate: mfgDate,
        expiryDate: expDate,
        quantity: quantityNum,
        remainingQuantity: quantityNum,
        price: priceNum,
        supplier: formData.supplier.trim() || undefined,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        isActive: true,
        createdAt: new Date(),
      };

      await createBatch(batchData);
      showToast("success", "Batch created successfully!");
      router.push("/dashboard/batches");
    } catch (error) {
      console.error(`Error creating batch:`, error);
      showToast("error", "Failed to create batch. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Note: ProductSearchDropdown now uses API search instead of pre-filtered products

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/batches">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
          </Link>
        </div>
      </div>

      {/* Scanner Status - Only show in Add mode */}
      <Card
        className={`mb-6 ${
          scannerActive
            ? "border-green-500 bg-green-50"
            : "border-blue-500 bg-blue-50"
        }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scan
                className={`h-6 w-6 ${
                  scannerActive
                    ? "text-green-600"
                    : "text-blue-600 animate-pulse"
                }`}
              />
              <div>
                <p className="font-medium">
                  {scannerActive ? "✓ Barcode Scanned!" : "Scanner Active"}
                </p>
                <p className="text-sm text-gray-600">
                  {scannerActive
                    ? "Batch ID captured successfully!"
                    : "Listening for barcode scans... Use your scanner device."}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                scannerActive
                  ? "bg-green-100 text-green-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
              {scannerActive ? "Scanned ✓" : "Listening..."}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left side (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Batch Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Batch ID */}
                <div className="space-y-2">
                  <Label htmlFor="batchId">
                    Batch ID (Barcode) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="batchId"
                      value={formData.batchId}
                      onChange={(e) =>
                        handleInputChange("batchId", e.target.value)
                      }
                      placeholder={"Scan barcode or enter batch ID manually"}
                      required
                      className={
                        scannerActive
                          ? "border-green-500 ring-2 ring-green-500"
                          : ""
                      }
                    />
                    <Scan
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                        scannerActive ? "text-green-500" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Use your barcode scanner device to scan, or type manually
                  </p>
                </div>

                {/* Product Selection */}
                <div className="space-y-2">
                  <Label htmlFor="product">
                    Product <span className="text-red-500">*</span>
                  </Label>
                  <ProductSearchDropdown
                    selectedProductId={formData.productId}
                    onSelect={handleProductSelect}
                    searchValue={productSearchValue}
                    onSearchChange={setProductSearchValue}
                    defaultProductImage="/images/default-image.svg"
                  />
                  {/* Note: Selected product display removed since dropdown now uses API search */}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturingDate">
                      Manufacturing Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="manufacturingDate"
                        type="date"
                        value={formData.manufacturingDate}
                        onChange={(e) =>
                          handleInputChange("manufacturingDate", e.target.value)
                        }
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">
                      Expiry Date <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) =>
                          handleInputChange("expiryDate", e.target.value)
                        }
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Quantity and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Total Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange(
                          "quantity",
                          e.target.value === "" ? "" : parseInt(e.target.value)
                        )
                      }
                      placeholder="Enter total quantity"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price per Unit <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        PKR
                      </span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange(
                            "price",
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value)
                          )
                        }
                        placeholder="0"
                        required
                        className="pl-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">
                    <User className="inline h-4 w-4 mr-1" />
                    Supplier (Optional)
                  </Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) =>
                      handleInputChange("supplier", e.target.value)
                    }
                    placeholder="Enter supplier name"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Storage Location (Optional)
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="e.g., Warehouse A, Shelf 3"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Add any additional notes about this batch"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="font-semibold text-blue-600">1.</span>
                  <p>
                    Use your barcode scanner to scan the batch ID, or enter it
                    manually.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-blue-600">2.</span>
                  <p>
                    Select the product this batch belongs to from the dropdown.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-blue-600">3.</span>
                  <p>Enter manufacturing and expiry dates accurately.</p>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-blue-600">4.</span>
                  <p>Fill in quantity and additional information.</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={loading}>
                    <Save className="w-4 h-4" />
                    {loading ? "Creating..." : "Create Batch"}
                  </Button>
                  <Link href="/dashboard/batches">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Alert for expiring soon */}
            {formData.expiryDate &&
              (() => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(formData.expiryDate).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
                  return (
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center text-orange-800">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <p className="text-sm">
                            Expires in <strong>{daysUntilExpiry}</strong> days
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else if (daysUntilExpiry <= 0) {
                  return (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center text-red-800">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          <p className="text-sm font-medium">
                            This batch has expired
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                return null;
              })()}
          </div>
        </div>
      </form>
    </div>
  );
}
