"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import discountService from "@/services/discountService";
import { useToast } from "@/components/ui/toast-context";
import { Discount, Category, Product } from "@/types";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { CategorySearchDropdown } from "@/components/features/categories/category-search-dropdown";
import Image from "next/image";

interface DiscountFormProps {
  discount?: Discount | null;
  categories?: Category[];
  products: Product[];
}

export function DiscountForm({
  discount,
  categories: initialCategories,
  products,
}: DiscountFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productSearchValue, setProductSearchValue] = useState("");
  const [categorySearchValue, setCategorySearchValue] = useState("");
  const [categories, setCategories] = useState<Category[]>(
    initialCategories || []
  );
  const [loadingCategories, setLoadingCategories] = useState(false);
  const isEditMode = !!discount;

  // Get initial product IDs for edit mode by finding products that have this discount
  const getInitialProductIds = () => {
    if (!discount) return [];
    return products
      .filter((p) => p.discountIds?.includes(discount.id))
      .map((p) => p.id);
  };

  // Get initial category IDs for edit mode by finding categories that have this discount
  const getInitialCategoryIds = () => {
    if (!discount || !categories) return [];
    const categoryIds: string[] = [];

    categories.forEach((category: any) => {
      // Check main category
      if (category.discountIds?.includes(discount.id)) {
        categoryIds.push(category.id);
      }

      // Check subcategories
      if (category.subcategories) {
        category.subcategories.forEach((sub: any) => {
          if (sub.discountIds?.includes(discount.id)) {
            categoryIds.push(`${category.id}/${sub.id}`);
          }
        });
      }
    });

    return categoryIds;
  };

  const initialProductIds = getInitialProductIds();
  const initialCategoryIds = getInitialCategoryIds();

  // Check if discount has existing associations (for disabling applicableTo in edit mode)
  const hasExistingAssociations =
    isEditMode &&
    (initialProductIds.length > 0 || initialCategoryIds.length > 0);

  // Form state
  const [formData, setFormData] = useState({
    name: discount?.name || "",
    description: discount?.description || "",
    value: discount?.value || 0,
    applicableTo: (discount?.applicableTo || "order") as
      | "products"
      | "categories"
      | "order",
    applicableProductIds: initialProductIds,
    applicableCategoryIds: initialCategoryIds,
    minPurchaseAmount: discount?.minPurchaseAmount || 0,
    startDate: discount?.startDate,
    endDate: discount?.endDate,
  });

  const handleInputChange = (
    field: string,
    value: string | number | boolean | string[] | Date | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Lazy-load categories when user selects "categories" as applicableTo
    if (
      field === "applicableTo" &&
      value === "categories" &&
      categories.length === 0 &&
      !loadingCategories
    ) {
      loadCategories();
    }
  };

  // Lazy-load categories when needed
  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetch("/api/categories/all");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      showToast("error", "Failed to load categories. Please try again.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      showToast("error", "Please enter discount name");
      return;
    }

    if (formData.value <= 0) {
      showToast("error", "Please enter a valid discount value");
      return;
    }

    if (formData.value > 100) {
      showToast("error", "Percentage discount cannot exceed 100%");
      return;
    }

    // Validate percentage decimal places (max 2)
    const decimalPlaces = (formData.value.toString().split(".")[1] || "")
      .length;
    if (decimalPlaces > 2) {
      showToast("error", "Percentage can have maximum 2 decimal places");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showToast("error", "Please select start and end dates");
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      showToast("error", "End date must be after start date");
      return;
    }

    setLoading(true);

    try {
      const discountData: Omit<Discount, "id"> | Partial<Discount> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        value: formData.value,
        applicableTo: formData.applicableTo,
        // Always include minPurchaseAmount for order-level discounts (even if 0)
        minPurchaseAmount:
          formData.applicableTo === "order"
            ? formData.minPurchaseAmount || 0
            : undefined,
        ...(!isEditMode && { currentUsageCount: 0 }),
        startDate,
        endDate,
      };

      // Determine product and category IDs based on applicableTo type
      const productIds =
        formData.applicableTo === "products"
          ? formData.applicableProductIds
          : undefined;
      const categoryIds =
        formData.applicableTo === "categories"
          ? formData.applicableCategoryIds
          : undefined;

      if (isEditMode && discount) {
        // Update existing discount
        await discountService.update(
          discount.id,
          discountData,
          productIds,
          categoryIds
        );
        showToast("success", "Discount updated successfully!");
      } else {
        // Create new discount
        await discountService.create(
          discountData as Omit<Discount, "id">,
          productIds,
          categoryIds
        );
        showToast("success", "Discount created successfully!");
      }

      router.push("/dashboard/discounts");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} discount:`,
        error
      );
      showToast(
        "error",
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
      formData.applicableProductIds.filter((id: string) => id !== productId)
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

  // Helper to find category or subcategory by ID (supports composite IDs like "parentId/subId")
  const findCategoryById = (categoryId: string) => {
    if (!categories) return null;

    // Check if it's a subcategory (composite ID)
    if (categoryId.includes("/")) {
      const [parentId, subId] = categoryId.split("/");
      const parentCategory = categories.find((c: any) => c.id === parentId);
      if (parentCategory && (parentCategory as any).subcategories) {
        const subcategory = (parentCategory as any).subcategories.find(
          (s: any) => s.id === subId
        );
        if (subcategory) {
          return {
            id: categoryId,
            name: subcategory.name,
            image: subcategory.image,
            parentName: parentCategory.name,
          };
        }
      }
    }

    // It's a main category
    const category = categories.find((c: any) => c.id === categoryId);
    if (category) {
      return {
        id: category.id,
        name: category.name,
        image: category.image,
      };
    }

    return null;
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                  <Label htmlFor="value">Percentage (%) *</Label>
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
                    max="100"
                    step="0.01"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter percentage value (0-100). Can include decimals up to 2
                    places (e.g., 10.25% or 1.5%)
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
                    disabled={hasExistingAssociations}
                    className={`w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      hasExistingAssociations
                        ? "bg-gray-100 cursor-not-allowed opacity-60"
                        : ""
                    }`}>
                    <option value="order">Total Order</option>
                    <option value="products">Specific Products</option>
                    <option value="categories">Categories</option>
                  </select>
                  {hasExistingAssociations && (
                    <p className="text-sm text-amber-600 mt-2 flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        Cannot change application type because this discount is
                        already assigned to{" "}
                        {initialProductIds.length > 0
                          ? `${initialProductIds.length} product(s)`
                          : ""}
                        {initialProductIds.length > 0 &&
                        initialCategoryIds.length > 0
                          ? " and "
                          : ""}
                        {initialCategoryIds.length > 0
                          ? `${initialCategoryIds.length} categor${
                              initialCategoryIds.length === 1 ? "y" : "ies"
                            }`
                          : ""}
                        . Remove all associations first to change the
                        application type.
                      </span>
                    </p>
                  )}
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
                    {formData.applicableProductIds.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {formData.applicableProductIds.map(
                          (productId: string) => {
                            const product = products.find(
                              (p) => p.id === productId
                            );
                            if (!product) return null;

                            return (
                              <div
                                key={productId}
                                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                                <Image
                                  src={
                                    product.multimedia.images[0] ||
                                    "/images/default-image.svg"
                                  }
                                  alt={product.info.name}
                                  className="w-12 h-12 object-cover rounded"
                                  width={48}
                                  height={48}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/images/default-image.svg";
                                  }}
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    {product.info.name}
                                  </h4>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleRemoveProduct(productId)
                                  }>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        No products selected yet
                      </div>
                    )}
                  </div>
                )}

                {formData.applicableTo === "categories" && (
                  <div>
                    <Label>Select Categories</Label>
                    <CategorySearchDropdown
                      onSelect={handleAddCategory}
                      searchValue={categorySearchValue}
                      onSearchChange={setCategorySearchValue}
                    />
                    {formData.applicableCategoryIds.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {formData.applicableCategoryIds.map((categoryId) => {
                          const categoryInfo = findCategoryById(categoryId);
                          if (!categoryInfo) return null;

                          return (
                            <div
                              key={categoryId}
                              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                              <Image
                                src={
                                  categoryInfo.image ||
                                  "/images/default-image.svg"
                                }
                                alt={categoryInfo.name}
                                className="w-12 h-12 object-cover rounded"
                                width={48}
                                height={48}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/images/default-image.svg";
                                }}
                              />
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {categoryInfo.name}
                                  {(categoryInfo as any).parentName && (
                                    <span className="ml-2 text-xs text-gray-500 font-normal">
                                      in {(categoryInfo as any).parentName}
                                    </span>
                                  )}
                                </h4>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveCategory(categoryId)
                                }>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                        No categories selected yet
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
                            ? ""
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
                      ? new Date(formData.startDate).toISOString().split("T")[0]
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
      </form>
    </div>
  );
}
