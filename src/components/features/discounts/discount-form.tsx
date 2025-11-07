"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import discountService from "@/services/discountService";
import { productService } from "@/services/productService";
import { Discount, Category, Product } from "@/types";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { CategorySearchDropdown } from "@/components/ui/category-search-dropdown";

interface DiscountFormProps {
  discount?: Discount | null;
  categories: Category[];
  products: Product[];
}

export function DiscountForm({
  discount,
  categories,
  products,
}: DiscountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [categorySearchValue, setCategorySearchValue] = useState("");
  const isEditMode = !!discount;

  // Form state
  const [formData, setFormData] = useState({
    name: discount?.name || "",
    description: discount?.description || "",
    type: (discount?.type || "percentage") as "percentage" | "fixed",
    value: discount?.value || 0,
    applicableTo: (discount?.applicableTo || "order") as
      | "products"
      | "categories"
      | "order",
    applicableProductIds: discount?.applicableProductIds || ([] as string[]),
    applicableCategoryIds: discount?.applicableCategoryIds || ([] as string[]),
    minPurchaseAmount: discount?.minPurchaseAmount || 0,
    startDate: discount?.startDate,
    endDate: discount?.endDate,
    isActive: discount?.isActive ?? true,
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean | string[] | Date | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert("Please enter discount name");
      return;
    }

    if (formData.value <= 0) {
      alert("Please enter a valid discount value");
      return;
    }

    if (formData.type === "percentage" && formData.value > 100) {
      alert("Percentage discount cannot exceed 100%");
      return;
    }

    // Validate percentage decimal places
    if (formData.type === "percentage") {
      const decimalPlaces = (formData.value.toString().split(".")[1] || "")
        .length;
      if (decimalPlaces > 2) {
        alert("Percentage can have maximum 2 decimal places");
        return;
      }
    }

    // Validate PKR amount is whole number
    if (formData.type === "fixed" && !Number.isInteger(formData.value)) {
      alert("PKR amount must be a whole number (no decimals)");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      alert("Please select start and end dates");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      alert("End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      const discountData: Omit<Discount, "id"> | Partial<Discount> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        value: formData.value,
        applicableTo: formData.applicableTo,
        applicableProductIds:
          formData.applicableTo === "products" &&
          formData.applicableProductIds.length > 0
            ? formData.applicableProductIds
            : undefined,
        applicableCategoryIds:
          formData.applicableTo === "categories" &&
          formData.applicableCategoryIds.length > 0
            ? formData.applicableCategoryIds
            : undefined,
        // Only include minPurchaseAmount for order-level discounts
        minPurchaseAmount:
          formData.applicableTo === "order" && formData.minPurchaseAmount > 0
            ? formData.minPurchaseAmount
            : undefined,
        ...(!isEditMode && { currentUsageCount: 0 }),
        startDate,
        endDate,
        isActive: formData.isActive,
      };

      let discountId: string;

      if (isEditMode && discount) {
        // Update existing discount
        await discountService.update(discount.id, discountData);
        discountId = discount.id;
        alert("Discount updated successfully!");
      } else {
        // Create the discount and get its ID
        discountId = await discountService.create(
          discountData as Omit<Discount, "id">
        );
        alert("Discount created successfully!");
      }

      // Update products with the new discount ID if applicable
      if (
        formData.applicableTo === "products" &&
        formData.applicableProductIds.length > 0
      ) {
        const updatePromises = formData.applicableProductIds.map(
          async (productId) => {
            try {
              const product = await productService.getById(productId);
              if (product) {
                // Add discount ID to product's discountIds array if not already present
                const existingDiscountIds = product.discountIds || [];
                if (!existingDiscountIds.includes(discountId)) {
                  await productService.update(productId, {
                    discountIds: [...existingDiscountIds, discountId],
                  });
                }
              }
            } catch (error) {
              console.error(
                `Error updating product ${productId} with discount:`,
                error
              );
            }
          }
        );

        await Promise.all(updatePromises);
      }

      // Update categories with the new discount ID if applicable
      // Note: Categories don't have discountIds in the schema, so we'll update products in those categories
      if (
        formData.applicableTo === "categories" &&
        formData.applicableCategoryIds.length > 0
      ) {
        const categoryService = (await import("@/services/categoryService"))
          .default;

        const updatePromises = formData.applicableCategoryIds.map(
          async (categoryId) => {
            try {
              const category = await categoryService.getCategoryById(
                categoryId
              );
              if (category && category.productIds.length > 0) {
                // Update all products in this category
                const productUpdatePromises = category.productIds.map(
                  async (productId) => {
                    try {
                      const product = await productService.getById(productId);
                      if (product) {
                        const existingDiscountIds = product.discountIds || [];
                        if (!existingDiscountIds.includes(discountId)) {
                          await productService.update(productId, {
                            discountIds: [...existingDiscountIds, discountId],
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        `Error updating product ${productId}:`,
                        error
                      );
                    }
                  }
                );
                await Promise.all(productUpdatePromises);
              }
            } catch (error) {
              console.error(
                `Error updating category ${categoryId} products:`,
                error
              );
            }
          }
        );

        await Promise.all(updatePromises);
      }

      router.push("/dashboard/discounts");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} discount:`,
        error
      );
      alert(
        `Failed to ${
          isEditMode ? "update" : "create"
        } discount. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Convert products to the format expected by ProductSearchDropdown
  // Filter out already selected products
  const availableProductsForDropdown = products
    .filter((product) => !formData.applicableProductIds.includes(product.id))
    .map((product) => ({
      id: product.id,
      name: product.info.name,
      image: product.multimedia.images[0] || "/images/default-image.svg",
    }));

  const handleAddProduct = (productId: string) => {
    if (!formData.applicableProductIds.includes(productId)) {
      handleInputChange("applicableProductIds", [
        ...formData.applicableProductIds,
        productId,
      ]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    handleInputChange(
      "applicableProductIds",
      formData.applicableProductIds.filter((id) => id !== productId)
    );
  };

  const handleAddCategory = (categoryId: string) => {
    if (!formData.applicableCategoryIds.includes(categoryId)) {
      handleInputChange("applicableCategoryIds", [
        ...formData.applicableCategoryIds,
        categoryId,
      ]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    handleInputChange(
      "applicableCategoryIds",
      formData.applicableCategoryIds.filter((id) => id !== categoryId)
    );
  };

  // Get selected product names
  const getSelectedProductNames = () => {
    return products
      .filter((p) => formData.applicableProductIds.includes(p.id))
      .map((p) => p.info.name);
  };

  // Get selected category names
  const getSelectedCategoryNames = () => {
    return categories
      .filter((c) => formData.applicableCategoryIds.includes(c.id))
      .map((c) => c.name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/discounts">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Discounts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Discount" : "Add New Discount"}
            </h1>
            <p className="text-gray-600">
              {isEditMode
                ? "Update discount information"
                : "Create a new promotional discount"}
            </p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Update Discount" : "Create Discount"}
            </>
          )}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Discount Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Summer Sale 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe this discount (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Discount Value */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Value</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Discount Type *</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange("type", "percentage")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        formData.type === "percentage"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}>
                      <span className="font-medium">Percentage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("type", "fixed")}
                      className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        formData.type === "fixed"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}>
                      <span className="font-medium">Fixed Amount</span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="value">
                    {formData.type === "percentage"
                      ? "Percentage (%)"
                      : "Amount (PKR)"}{" "}
                    *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      handleInputChange(
                        "value",
                        e.target.value === "" ? "" : parseFloat(e.target.value)
                      )
                    }
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                    step={formData.type === "percentage" ? "0.01" : "1"}
                    required
                  />
                  {formData.type === "percentage" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Can include decimals (e.g., 10.25% or 1.5%)
                    </p>
                  )}
                  {formData.type === "fixed" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Must be a whole number (no decimals)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Applicability */}
            <Card>
              <CardHeader>
                <CardTitle>Applies To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Application Type *</Label>
                  <select
                    value={formData.applicableTo}
                    onChange={(e) =>
                      handleInputChange(
                        "applicableTo",
                        e.target.value as "products" | "categories" | "order"
                      )
                    }
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="order">Total Order</option>
                    <option value="products">Specific Products</option>
                    <option value="categories">Categories</option>
                  </select>
                </div>

                {formData.applicableTo === "products" && (
                  <div>
                    <Label>Select Products</Label>
                    <ProductSearchDropdown
                      availableProducts={availableProductsForDropdown}
                      selectedProductId=""
                      onSelect={handleAddProduct}
                      searchValue={productSearchValue}
                      onSearchChange={setProductSearchValue}
                      defaultProductImage="/images/default-image.svg"
                    />
                    {formData.applicableProductIds.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Products (
                          {formData.applicableProductIds.length}
                          ):
                        </p>
                        <div className="space-y-1">
                          {getSelectedProductNames().map((name, index) => (
                            <div
                              key={formData.applicableProductIds[index]}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-sm">{name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveProduct(
                                    formData.applicableProductIds[index]
                                  )
                                }
                                className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.applicableTo === "categories" && (
                  <div>
                    <Label>Select Categories</Label>
                    <CategorySearchDropdown
                      availableCategories={categories}
                      selectedCategoryId=""
                      onSelect={handleAddCategory}
                      searchValue={categorySearchValue}
                      onSearchChange={setCategorySearchValue}
                    />
                    {formData.applicableCategoryIds.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Categories (
                          {formData.applicableCategoryIds.length}):
                        </p>
                        <div className="space-y-1">
                          {getSelectedCategoryNames().map((name, index) => (
                            <div
                              key={formData.applicableCategoryIds[index]}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-sm">{name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCategory(
                                    formData.applicableCategoryIds[index]
                                  )
                                }
                                className="text-red-600 hover:text-red-800 text-sm font-medium">
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.applicableTo === "order" && (
                  <div>
                    <Label htmlFor="minPurchaseAmount">
                      Minimum Purchase Amount (PKR)
                    </Label>
                    <Input
                      id="minPurchaseAmount"
                      type="number"
                      value={formData.minPurchaseAmount}
                      onChange={(e) =>
                        handleInputChange(
                          "minPurchaseAmount",
                          e.target.value === ""
                            ? 0
                            : Math.floor(parseFloat(e.target.value))
                        )
                      }
                      min="0"
                      step="1"
                      placeholder="0 (no minimum)"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Customer must spend this amount to use the discount (leave
                      0 for no minimum). Must be a whole number.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium">Active</span>
                    <p className="text-sm text-gray-500">
                      Discount is available for use
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle>Validity Period</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={
                      formData.startDate
                        ? new Date(formData.startDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "startDate",
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={
                      formData.endDate
                        ? new Date(formData.endDate).toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "endDate",
                        e.target.value ? new Date(e.target.value) : undefined
                      )
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
