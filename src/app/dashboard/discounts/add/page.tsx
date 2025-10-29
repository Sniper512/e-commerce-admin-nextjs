"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Percent, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DiscountService } from "@/services/discountService";
import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import { Discount, Category, Product } from "@/types";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { CategorySearchDropdown } from "@/components/ui/category-search-dropdown";

export default function AddDiscountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [categorySearchValue, setCategorySearchValue] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed",
    value: 0,
    applicableTo: "order" as "products" | "categories" | "order",
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    minPurchaseAmount: 0,
    limitationType: "unlimited" as
      | "unlimited"
      | "n_times_only"
      | "n_times_per_customer",
    limitationTimes: 0,
    adminComment: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });

  // Load categories and products on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        categoryService.getAllCategories(),
        productService.getAll({ isActive: true }),
      ]);
      setCategories(categoriesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load categories and products");
    }
  };

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
      const discountData: Omit<Discount, "id" | "createdAt" | "updatedAt"> = {
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
        currentUsageCount: 0,
        adminComment: formData.adminComment.trim() || undefined,
        startDate,
        endDate,
        isActive: formData.isActive,
      };

      // Create the discount and get its ID
      const discountId = await DiscountService.createDiscount(discountData);

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
                const existingDiscountIds = product.pricing.discountIds || [];
                if (!existingDiscountIds.includes(discountId)) {
                  await productService.update(productId, {
                    pricing: {
                      ...product.pricing,
                      discountIds: [...existingDiscountIds, discountId],
                    },
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
                        const existingDiscountIds =
                          product.pricing.discountIds || [];
                        if (!existingDiscountIds.includes(discountId)) {
                          await productService.update(productId, {
                            pricing: {
                              ...product.pricing,
                              discountIds: [...existingDiscountIds, discountId],
                            },
                          });
                        }
                      }
                    } catch (error) {
                      console.error(
                        `Error updating product ${productId} in category:`,
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

      alert("Discount created successfully!");
      router.push("/dashboard/discounts");
    } catch (error) {
      console.error("Error creating discount:", error);
      alert("Failed to create discount. Please try again.");
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
      sku: product.sku,
      price: product.pricing.price,
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Discount</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a new discount or promotional offer
          </p>
        </div>
        <Link href="/dashboard/discounts">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Discounts
          </Button>
        </Link>
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
                    placeholder="Brief description of the discount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
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
                  <Label htmlFor="type">Discount Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      handleInputChange(
                        "type",
                        e.target.value as "percentage" | "fixed"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="value">
                    {formData.type === "percentage"
                      ? "Discount Percentage *"
                      : "Discount Amount (₦) *"}
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {formData.type === "percentage" ? (
                        <Percent className="w-4 h-4 text-gray-400" />
                      ) : (
                        <DollarSign className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e) =>
                        handleInputChange(
                          "value",
                          Number.parseFloat(e.target.value)
                        )
                      }
                      placeholder={
                        formData.type === "percentage" ? "10" : "1000"
                      }
                      min="0"
                      max={formData.type === "percentage" ? "100" : undefined}
                      step="0.01"
                      className="pl-10"
                      required
                    />
                  </div>
                  {formData.type === "percentage" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a value between 0 and 100
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minPurchaseAmount">
                    Minimum Purchase Amount (₦)
                  </Label>
                  <Input
                    id="minPurchaseAmount"
                    type="number"
                    value={formData.minPurchaseAmount}
                    onChange={(e) =>
                      handleInputChange(
                        "minPurchaseAmount",
                        Number.parseFloat(e.target.value)
                      )
                    }
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave as 0 for no minimum requirement
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Applicability */}
            <Card>
              <CardHeader>
                <CardTitle>Applicability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="applicableTo">Applies To *</Label>
                  <select
                    id="applicableTo"
                    value={formData.applicableTo}
                    onChange={(e) =>
                      handleInputChange(
                        "applicableTo",
                        e.target.value as "products" | "categories" | "order"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                    <option value="order">Total Order Amount</option>
                    <option value="products">Specific Products</option>
                    <option value="categories">Specific Categories</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose what this discount applies to
                  </p>
                </div>

                {formData.applicableTo === "products" && (
                  <div>
                    <Label htmlFor="applicableProducts">
                      Applicable Products *
                    </Label>
                    <ProductSearchDropdown
                      availableProducts={availableProductsForDropdown}
                      selectedProductId=""
                      onSelect={handleAddProduct}
                      placeholder="Search and select products..."
                      searchValue={productSearchValue}
                      onSearchChange={setProductSearchValue}
                      defaultProductImage="/images/default-product.svg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Search for products and click to add them
                    </p>
                    {formData.applicableProducts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-blue-800">
                          Selected ({formData.applicableProducts.length}):
                        </p>
                        <div className="space-y-2">
                          {formData.applicableProducts.map((productId) => {
                            const product = products.find(
                              (p) => p.id === productId
                            );
                            if (!product) return null;
                            return (
                              <div
                                key={productId}
                                className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                <img
                                  src={
                                    product.multimedia.images[0]?.url ||
                                    "/images/default-product.svg"
                                  }
                                  alt={product.info.name}
                                  className="w-10 h-10 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/images/default-product.svg";
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-blue-900">
                                    {product.info.name}
                                  </div>
                                  <div className="text-xs text-blue-700">
                                    {product.sku} • ₦{product.pricing.price}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(productId)}
                                  className="text-red-600 hover:text-red-800 p-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.applicableTo === "categories" && (
                  <div>
                    <Label htmlFor="applicableCategories">
                      Applicable Categories *
                    </Label>
                    <CategorySearchDropdown
                      availableCategories={categories.filter(
                        (cat) => !formData.applicableCategories.includes(cat.id)
                      )}
                      selectedCategoryId=""
                      onSelect={handleAddCategory}
                      placeholder="Search and select categories..."
                      searchValue={categorySearchValue}
                      onSearchChange={setCategorySearchValue}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Search for categories and click to add them
                    </p>
                    {formData.applicableCategories.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-teal-800">
                          Selected ({formData.applicableCategories.length}):
                        </p>
                        <div className="space-y-2">
                          {formData.applicableCategories.map((categoryId) => {
                            const category = categories.find(
                              (c) => c.id === categoryId
                            );
                            if (!category) return null;
                            return (
                              <div
                                key={categoryId}
                                className="flex items-center gap-3 p-2 bg-teal-50 border border-teal-200 rounded-md">
                                <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded flex items-center justify-center">
                                  <span className="text-teal-600 font-semibold text-sm">
                                    {category.name
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-teal-900">
                                    {category.name}
                                  </div>
                                  {category.description && (
                                    <div className="text-xs text-teal-700 truncate">
                                      {category.description}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveCategory(categoryId)
                                  }
                                  className="text-red-600 hover:text-red-800 p-1">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {formData.applicableTo === "order" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Total Order Discount:</strong> This discount will
                      be applied to the entire order amount when the minimum
                      purchase requirement is met.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount Limitation */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Limitation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="limitationType">Limitation Type *</Label>
                  <select
                    id="limitationType"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required>
                    <option value="unlimited">Unlimited</option>
                    <option value="n_times_only">N times only</option>
                    <option value="n_times_per_customer">
                      N times per customer
                    </option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    How many times can this discount be used?
                  </p>
                </div>

                {formData.limitationType !== "unlimited" && (
                  <div>
                    <Label htmlFor="limitationTimes">
                      {formData.limitationType === "n_times_only"
                        ? "Maximum Total Uses *"
                        : "Maximum Uses Per Customer *"}
                    </Label>
                    <Input
                      id="limitationTimes"
                      type="number"
                      value={formData.limitationTimes}
                      onChange={(e) =>
                        handleInputChange(
                          "limitationTimes",
                          Number.parseInt(e.target.value)
                        )
                      }
                      placeholder="Enter number of uses"
                      min="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.limitationType === "n_times_only"
                        ? "Total number of times this discount can be used across all customers"
                        : "Maximum number of times each customer can use this discount"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Comment</CardTitle>
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
                <p className="text-xs text-gray-500 mt-1">
                  Optional internal notes for admins only
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
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Discount will be active immediately after creation
                </p>
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
                    type="datetime-local"
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
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      handleInputChange("endDate", e.target.value)
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full gap-2"
                    disabled={loading}>
                    <Save className="w-4 h-4" />
                    {loading ? "Creating..." : "Create Discount"}
                  </Button>
                  <Link href="/dashboard/discounts">
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
          </div>
        </div>
      </form>
    </div>
  );
}
