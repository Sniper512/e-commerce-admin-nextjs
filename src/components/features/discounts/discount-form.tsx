"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Percent, DollarSign, Loader2 } from "lucide-react";
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

  // Helper function to format date for input
  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return "";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toISOString().slice(0, 16);
  };

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
    applicableProducts: discount?.applicableProducts || ([] as string[]),
    applicableCategories: discount?.applicableCategories || ([] as string[]),
    minPurchaseAmount: discount?.minPurchaseAmount || 0,
    limitationType: (discount?.limitationType || "unlimited") as
      | "unlimited"
      | "n_times_only"
      | "n_times_per_customer",
    limitationTimes: discount?.limitationTimes || 0,
    adminComment: discount?.adminComment || "",
    startDate: formatDateForInput(discount?.startDate) || "",
    endDate: formatDateForInput(discount?.endDate) || "",
    isActive: discount?.isActive ?? true,
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean | string[]
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
      const discountData:
        | Omit<Discount, "id" | "createdAt" | "updatedAt">
        | Partial<Discount> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        value: formData.value,
        applicableTo: formData.applicableTo,
        applicableProducts:
          formData.applicableTo === "products" &&
          formData.applicableProducts.length > 0
            ? formData.applicableProducts
            : undefined,
        applicableCategories:
          formData.applicableTo === "categories" &&
          formData.applicableCategories.length > 0
            ? formData.applicableCategories
            : undefined,
        minPurchaseAmount:
          formData.minPurchaseAmount > 0
            ? formData.minPurchaseAmount
            : undefined,
        limitationType: formData.limitationType,
        limitationTimes:
          formData.limitationType !== "unlimited" &&
          formData.limitationTimes > 0
            ? formData.limitationTimes
            : undefined,
        ...(!isEditMode && { currentUsageCount: 0 }),
        adminComment: formData.adminComment.trim() || undefined,
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
          discountData as Omit<Discount, "id" | "createdAt" | "updatedAt">
        );
        alert("Discount created successfully!");
      }

      // Update products with the new discount ID if applicable
      if (
        formData.applicableTo === "products" &&
        formData.applicableProducts.length > 0
      ) {
        const updatePromises = formData.applicableProducts.map(
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
        formData.applicableCategories.length > 0
      ) {
        const categoryService = (await import("@/services/categoryService"))
          .default;

        const updatePromises = formData.applicableCategories.map(
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
    .filter((product) => !formData.applicableProducts.includes(product.id))
    .map((product) => ({
      id: product.id,
      name: product.info.name,
      image: product.multimedia.images[0]?.url || "/images/default-product.svg",
    }));

  const handleAddProduct = (productId: string) => {
    if (!formData.applicableProducts.includes(productId)) {
      handleInputChange("applicableProducts", [
        ...formData.applicableProducts,
        productId,
      ]);
    }
  };

  const handleRemoveProduct = (productId: string) => {
    handleInputChange(
      "applicableProducts",
      formData.applicableProducts.filter((id) => id !== productId)
    );
  };

  const handleAddCategory = (categoryId: string) => {
    if (!formData.applicableCategories.includes(categoryId)) {
      handleInputChange("applicableCategories", [
        ...formData.applicableCategories,
        categoryId,
      ]);
    }
  };

  const handleRemoveCategory = (categoryId: string) => {
    handleInputChange(
      "applicableCategories",
      formData.applicableCategories.filter((id) => id !== categoryId)
    );
  };

  // Get selected product names
  const getSelectedProductNames = () => {
    return products
      .filter((p) => formData.applicableProducts.includes(p.id))
      .map((p) => p.info.name);
  };

  // Get selected category names
  const getSelectedCategoryNames = () => {
    return categories
      .filter((c) => formData.applicableCategories.includes(c.id))
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
                      <Percent className="h-5 w-5" />
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
                      <DollarSign className="h-5 w-5" />
                      <span className="font-medium">Fixed Amount</span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="value">
                    {formData.type === "percentage"
                      ? "Percentage (%)"
                      : "Amount ($)"}{" "}
                    *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) =>
                      handleInputChange("value", parseFloat(e.target.value))
                    }
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minPurchaseAmount">
                    Minimum Purchase Amount ($)
                  </Label>
                  <Input
                    id="minPurchaseAmount"
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) =>
                      handleInputChange(
                        "minPurchaseAmount",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    min="0"
                    step="0.01"
                    placeholder="0 (no minimum)"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Customer must spend this amount to use the discount
                  </p>
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
                      defaultProductImage="/images/default-product.svg"
                    />
                    {formData.applicableProducts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Products (
                          {formData.applicableProducts.length}
                          ):
                        </p>
                        <div className="space-y-1">
                          {getSelectedProductNames().map((name, index) => (
                            <div
                              key={formData.applicableProducts[index]}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-sm">{name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveProduct(
                                    formData.applicableProducts[index]
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
                    {formData.applicableCategories.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Categories (
                          {formData.applicableCategories.length}):
                        </p>
                        <div className="space-y-1">
                          {getSelectedCategoryNames().map((name, index) => (
                            <div
                              key={formData.applicableCategories[index]}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                              <span className="text-sm">{name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveCategory(
                                    formData.applicableCategories[index]
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
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      This discount will apply to the entire order total.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount Limitation */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Limitation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Limitation Type</Label>
                  <select
                    value={formData.limitationType}
                    onChange={(e) =>
                      handleInputChange(
                        "limitationType",
                        e.target.value as
                          | "unlimited"
                          | "n_times_only"
                          | "n_times_per_customer"
                      )
                    }
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="unlimited">Unlimited</option>
                    <option value="n_times_only">
                      Limited number of times (total)
                    </option>
                    <option value="n_times_per_customer">
                      Limited per customer
                    </option>
                  </select>
                </div>

                {formData.limitationType !== "unlimited" && (
                  <div>
                    <Label htmlFor="limitationTimes">
                      {formData.limitationType === "n_times_only"
                        ? "Total Uses"
                        : "Uses Per Customer"}
                    </Label>
                    <Input
                      id="limitationTimes"
                      type="number"
                      value={formData.limitationTimes}
                      onChange={(e) =>
                        handleInputChange(
                          "limitationTimes",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                      placeholder="Enter limit"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  id="adminComment"
                  value={formData.adminComment}
                  onChange={(e) =>
                    handleInputChange("adminComment", e.target.value)
                  }
                  placeholder="Internal notes about this discount (not visible to customers)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
                <p className="text-sm text-gray-500 mt-1">
                  These notes are only visible to admins
                </p>
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
                    value={formData.startDate}
                    onChange={(e) =>
                      handleInputChange("startDate", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
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
