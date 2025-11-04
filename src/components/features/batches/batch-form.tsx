"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Scan, Package, AlertCircle, Calendar, MapPin, User, FileText } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import batchService from "@/services/batchService";
import { Batch, Product, BatchStatus } from "@/types";
import { useSymbologyScanner } from "@use-symbology-scanner/react";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";

interface BatchFormProps {
  batch?: Batch | null;
  products: Product[];
}

export function BatchForm({ batch, products }: BatchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const isEditMode = !!batch;

  // Helper function to format date for input
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Form state
  const [formData, setFormData] = useState({
    batchId: batch?.batchId || "",
    productId: batch?.productId || "",
    manufacturingDate: formatDateForInput(batch?.manufacturingDate) || "",
    expiryDate: formatDateForInput(batch?.expiryDate) || "",
    quantity: batch?.quantity || 0,
    remainingQuantity: batch?.remainingQuantity || 0,
    status: (batch?.status || "active") as BatchStatus,
    supplier: batch?.supplier || "",
    location: batch?.location || "",
    notes: batch?.notes || "",
  });

  // Barcode scanner - only in add mode
  const handleSymbol = (symbol: string, matchedSymbologies: string[]) => {
    if (isEditMode) return; // Disable scanner in edit mode
    
    console.log("Scanned symbol:", symbol, "Symbologies:", matchedSymbologies);
    handleInputChange("batchId", symbol);
    setScannerActive(true);

    // Show feedback (optional: add beep sound)
    const audio = new Audio("/sounds/beep.mp3");
    audio.play().catch(() => {});

    // Flash effect - reset active state after 1 second
    setTimeout(() => setScannerActive(false), 1000);
  };

  // Use barcode scanner
  useSymbologyScanner(handleSymbol);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProductSelect = (productId: string) => {
    handleInputChange("productId", productId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.batchId.trim()) {
      alert("Please enter or scan a batch ID");
      return;
    }

    if (!formData.productId) {
      alert("Please select a product");
      return;
    }

    if (!formData.manufacturingDate || !formData.expiryDate) {
      alert("Please enter manufacturing and expiry dates");
      return;
    }

    const mfgDate = new Date(formData.manufacturingDate);
    const expDate = new Date(formData.expiryDate);

    if (expDate <= mfgDate) {
      alert("Expiry date must be after manufacturing date");
      return;
    }

    if (formData.quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }

    if (isEditMode && formData.remainingQuantity > formData.quantity) {
      alert("Remaining quantity cannot exceed total quantity");
      return;
    }

    setLoading(true);

    try {
      const product = products.find((p) => p.id === formData.productId);

      if (isEditMode && batch) {
        // Update existing batch
        const updateData: Partial<Batch> = {
          batchId: formData.batchId.trim(),
          productId: formData.productId,
          productName: product?.info.name,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          quantity: formData.quantity,
          remainingQuantity: formData.remainingQuantity,
          status: formData.status,
          supplier: formData.supplier.trim() || undefined,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
        };

        await batchService.updateBatch(batch.id, updateData);
        alert("Batch updated successfully!");
        router.push("/dashboard/batches");
      } else {
        // Check if batch ID already exists (only for new batches)
        const existingBatch = await batchService.getBatchByBatchId(formData.batchId);
        if (existingBatch) {
          alert("A batch with this ID already exists");
          setLoading(false);
          return;
        }

        // Create new batch
        const batchData: Omit<Batch, "id" | "createdAt" | "updatedAt"> = {
          batchId: formData.batchId.trim(),
          productId: formData.productId,
          productName: product?.info.name,
          manufacturingDate: mfgDate,
          expiryDate: expDate,
          quantity: formData.quantity,
          remainingQuantity: formData.quantity,
          supplier: formData.supplier.trim() || undefined,
          location: formData.location.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          status: "active",
        };

        await batchService.createBatch(batchData);
        alert("Batch created successfully!");
        router.push("/dashboard/batches");
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} batch:`, error);
      alert(`Failed to ${isEditMode ? "update" : "create"} batch. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Convert products to dropdown format
  const availableProductsForDropdown = products.map((product) => ({
    id: product.id,
    name: product.info.name,
    image: product.multimedia.images[0]?.url || "/images/default-image.svg",
  }));

  const selectedProduct = products.find((p) => p.id === formData.productId);

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
      {!isEditMode && (
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
      )}

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
                  onChange={(e) => handleInputChange("batchId", e.target.value)}
                  placeholder={isEditMode ? "Batch ID" : "Scan barcode or enter batch ID manually"}
                  required
                  disabled={isEditMode}
                  className={scannerActive ? "border-green-500 ring-2 ring-green-500" : ""}
                />
                {!isEditMode && (
                  <Scan
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      scannerActive ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                )}
              </div>
              {!isEditMode ? (
                <p className="text-xs text-gray-500">
                  Use your barcode scanner device to scan, or type manually
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Batch ID cannot be changed after creation
                </p>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Product <span className="text-red-500">*</span>
              </Label>
              <ProductSearchDropdown
                availableProducts={availableProductsForDropdown}
                selectedProductId={formData.productId}
                onSelect={handleProductSelect}
                searchValue={productSearchValue}
                onSearchChange={setProductSearchValue}
                defaultProductImage="/images/default-image.svg"
              />
              {selectedProduct && (
                <div className="text-sm text-gray-600 mt-2">
                  <p>Selected: {selectedProduct.info.name}</p>
                </div>
              )}
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

            {/* Quantity */}
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
                    handleInputChange("quantity", parseInt(e.target.value) || 0)
                  }
                  placeholder="Enter total quantity"
                  required
                />
              </div>

              {isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="remainingQuantity">
                    Remaining Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="remainingQuantity"
                    type="number"
                    min="0"
                    max={formData.quantity}
                    value={formData.remainingQuantity}
                    onChange={(e) =>
                      handleInputChange(
                        "remainingQuantity",
                        parseInt(e.target.value) || 0
                      )
                    }
                    required
                  />
                  <p className="text-xs text-gray-500">
                    {Math.round(
                      (formData.remainingQuantity / formData.quantity) * 100
                    )}
                    % remaining
                  </p>
                </div>
              )}
            </div>

            {/* Status (Edit mode only) */}
            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange("status", e.target.value as BatchStatus)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="recalled">Recalled</option>
                </select>
              </div>
            )}

            {/* Supplier */}
            <div className="space-y-2">
              <Label htmlFor="supplier">
                <User className="inline h-4 w-4 mr-1" />
                Supplier (Optional)
              </Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => handleInputChange("supplier", e.target.value)}
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
                onChange={(e) => handleInputChange("location", e.target.value)}
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
          {/* Instructions - Only in Add mode */}
          {!isEditMode && (
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
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading}>
                  <Save className="w-4 h-4" />
                  {loading 
                    ? (isEditMode ? "Updating..." : "Creating...") 
                    : (isEditMode ? "Update Batch" : "Create Batch")
                  }
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

          {/* Preview */}
          {formData.batchId && formData.productId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Batch ID:</span>
                  <p className="font-medium">{formData.batchId}</p>
                </div>
                {selectedProduct && (
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <p className="font-medium">{selectedProduct.info.name}</p>
                  </div>
                )}
                {formData.quantity > 0 && (
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <p className="font-medium">{formData.quantity} units</p>
                  </div>
                )}
                {isEditMode && formData.remainingQuantity >= 0 && (
                  <div>
                    <span className="text-gray-600">Remaining:</span>
                    <p className="font-medium">{formData.remainingQuantity} units</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Alert for expiring soon */}
        {formData.expiryDate && (
          (() => {
            const daysUntilExpiry = Math.ceil(
              (new Date(formData.expiryDate).getTime() - new Date().getTime()) /
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
          })()
        )}
        </div>
      </div>
      </form>
    </div>
  );
}
