"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import BatchService from "@/services/batchService";
import { productService } from "@/services/productService";
import { Batch, Product, BatchStatus } from "@/types";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import {
  ArrowLeft,
  Save,
  Package,
  Calendar,
  MapPin,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function EditBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchValue, setProductSearchValue] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    batchId: "",
    productId: "",
    manufacturingDate: "",
    expiryDate: "",
    quantity: 0,
    remainingQuantity: 0,
    status: "active" as BatchStatus,
    supplier: "",
    location: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBatch();
    loadProducts();
  }, [batchId]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const batchData = await BatchService.getBatchById(batchId);
      if (batchData) {
        setBatch(batchData);
        setFormData({
          batchId: batchData.batchId,
          productId: batchData.productId,
          manufacturingDate: formatDateForInput(batchData.manufacturingDate),
          expiryDate: formatDateForInput(batchData.expiryDate),
          quantity: batchData.quantity,
          remainingQuantity: batchData.remainingQuantity,
          status: batchData.status,
          supplier: batchData.supplier || "",
          location: batchData.location || "",
          notes: batchData.notes || "",
        });
      } else {
        alert("Batch not found");
        router.push("/dashboard/batches");
      }
    } catch (error) {
      console.error("Error loading batch:", error);
      alert("Failed to load batch details");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await productService.getAll();
      setProducts(allProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.batchId.trim()) {
      newErrors.batchId = "Batch ID is required";
    }

    if (!formData.productId) {
      newErrors.productId = "Product is required";
    }

    if (!formData.manufacturingDate) {
      newErrors.manufacturingDate = "Manufacturing date is required";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    }

    // Validate date logic
    if (formData.manufacturingDate && formData.expiryDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);

      if (expDate <= mfgDate) {
        newErrors.expiryDate = "Expiry date must be after manufacturing date";
      }
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (formData.remainingQuantity < 0) {
      newErrors.remainingQuantity = "Remaining quantity cannot be negative";
    }

    if (formData.remainingQuantity > formData.quantity) {
      newErrors.remainingQuantity =
        "Remaining quantity cannot exceed initial quantity";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors in the form");
      return;
    }

    if (!batch) return;

    try {
      setSaving(true);

      const updateData: Partial<Batch> = {
        batchId: formData.batchId.trim(),
        productId: formData.productId,
        manufacturingDate: new Date(formData.manufacturingDate),
        expiryDate: new Date(formData.expiryDate),
        quantity: formData.quantity,
        remainingQuantity: formData.remainingQuantity,
        status: formData.status,
        supplier: formData.supplier.trim() || undefined,
        location: formData.location.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      };

      await BatchService.updateBatch(batch.id, updateData);
      alert("Batch updated successfully!");
      router.push(`/dashboard/batches/${batch.id}`);
    } catch (error: any) {
      console.error("Error updating batch:", error);
      alert("Failed to update batch: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Batch not found</p>
          <Link href="/dashboard/batches">
            <Button className="mt-4">Back to Batches</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Batch</h1>
          <p className="text-sm text-gray-500 mt-1">Update batch information</p>
        </div>
        <Link href={`/dashboard/batches/${batch.id}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Batch Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batchId">
                    Batch ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="batchId"
                    value={formData.batchId}
                    onChange={(e) =>
                      handleInputChange("batchId", e.target.value)
                    }
                    placeholder="Enter batch ID"
                    className={errors.batchId ? "border-red-500" : ""}
                  />
                  {errors.batchId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.batchId}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="product">
                    Product <span className="text-red-500">*</span>
                  </Label>
                  <ProductSearchDropdown
                    availableProducts={products.map((p) => ({
                      id: p.id,
                      name: p.info.name,
                      sku: p.sku,
                      price: p.pricing.price,
                      image:
                        p.multimedia?.images?.[0]?.url ||
                        "/images/default-product.png",
                    }))}
                    selectedProductId={formData.productId}
                    onSelect={(productId: string) =>
                      handleInputChange("productId", productId)
                    }
                    searchValue={productSearchValue}
                    onSearchChange={setProductSearchValue}
                    placeholder="Search and select product..."
                    defaultProductImage="/images/default-product.png"
                  />
                  {errors.productId && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.productId}
                    </p>
                  )}
                  {selectedProduct && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                      {selectedProduct.multimedia?.images &&
                        selectedProduct.multimedia.images.length > 0 && (
                          <img
                            src={selectedProduct.multimedia.images[0].url}
                            alt={selectedProduct.info.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                      <div>
                        <p className="font-medium text-sm">
                          {selectedProduct.info.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          SKU: {selectedProduct.sku}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturingDate">
                      Manufacturing Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="manufacturingDate"
                      type="date"
                      value={formData.manufacturingDate}
                      onChange={(e) =>
                        handleInputChange("manufacturingDate", e.target.value)
                      }
                      className={
                        errors.manufacturingDate ? "border-red-500" : ""
                      }
                    />
                    {errors.manufacturingDate && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.manufacturingDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="expiryDate">
                      Expiry Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) =>
                        handleInputChange("expiryDate", e.target.value)
                      }
                      className={errors.expiryDate ? "border-red-500" : ""}
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.expiryDate}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantities */}
            <Card>
              <CardHeader>
                <CardTitle>Quantity Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">
                      Initial Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange(
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="remainingQuantity">
                      Remaining Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="remainingQuantity"
                      type="number"
                      min="0"
                      value={formData.remainingQuantity}
                      onChange={(e) =>
                        handleInputChange(
                          "remainingQuantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={
                        errors.remainingQuantity ? "border-red-500" : ""
                      }
                    />
                    {errors.remainingQuantity && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.remainingQuantity}
                      </p>
                    )}
                  </div>
                </div>

                {/* Usage display */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Used:</strong>{" "}
                    {(
                      formData.quantity - formData.remainingQuantity
                    ).toLocaleString()}{" "}
                    units (
                    {Math.round(
                      ((formData.quantity - formData.remainingQuantity) /
                        formData.quantity) *
                        100
                    ) || 0}
                    % utilized)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="supplier" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Supplier
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

                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Storage Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="e.g., Warehouse A, Section B3"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes about this batch..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Batch Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange("status", e.target.value as BatchStatus)
                  }
                  className="mt-1">
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="recalled">Recalled</option>
                </Select>
              </CardContent>
            </Card>

            {/* Warning Message */}
            {formData.status === "recalled" && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">
                        Recalled Batch
                      </h4>
                      <p className="text-sm text-red-800">
                        This batch is marked as recalled. Please ensure all
                        affected products are removed from circulation.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Link href={`/dashboard/batches/${batch.id}`} className="block">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
