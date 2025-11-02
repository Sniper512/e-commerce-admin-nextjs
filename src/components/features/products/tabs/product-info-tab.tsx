"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Category, Manufacturer, SubCategory } from "@/types";
import { parseCategoryId, createCategoryIdString } from "@/types";

interface ProductInfoTabProps {
  productName: string;
  onProductNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  categoryIds: string[];
  onCategoryIdsChange: (value: string[]) => void;
  categories: Category[];
  manufacturerId: string;
  onManufacturerIdChange: (value: string) => void;
  manufacturers: Manufacturer[];
  productTags: string[];
  onProductTagsChange: (value: string[]) => void;
  isPublished: boolean;
  onIsPublishedChange: (value: boolean) => void;
  allowCustomerReviews: boolean;
  onAllowCustomerReviewsChange: (value: boolean) => void;
  markAsNew: boolean;
  onMarkAsNewChange: (value: boolean) => void;
  markAsNewStartDate?: Date;
  onMarkAsNewStartDateChange: (value: Date | undefined) => void;
  markAsNewEndDate?: Date;
  onMarkAsNewEndDateChange: (value: Date | undefined) => void;
}

export function ProductInfoTab({
  productName,
  onProductNameChange,
  description,
  onDescriptionChange,
  categoryIds,
  onCategoryIdsChange,
  categories,
  manufacturerId,
  onManufacturerIdChange,
  manufacturers,
  productTags,
  onProductTagsChange,
  isPublished,
  onIsPublishedChange,
  allowCustomerReviews,
  onAllowCustomerReviewsChange,
  markAsNew,
  onMarkAsNewChange,
  markAsNewStartDate,
  onMarkAsNewStartDateChange,
  markAsNewEndDate,
  onMarkAsNewEndDateChange,
}: ProductInfoTabProps) {
  // Helper function to get category/subcategory name by ID string
  const getCategoryName = (categoryIdString: string): string => {
    const parsed = parseCategoryId(categoryIdString);

    if (parsed.isSubCategory) {
      const category = categories.find((cat) => cat.id === parsed.categoryId);
      const subCategory = (category as any)?.subcategories?.find(
        (sub: SubCategory) => sub.id === parsed.subCategoryId
      );
      return category && subCategory
        ? `${category.name} >> ${subCategory.name}`
        : "Unknown";
    }

    const category = categories.find((cat) => cat.id === parsed.categoryId);
    return category?.name || "Unknown";
  };

  // Handle adding a category
  const handleAddCategory = (categoryIdString: string) => {
    if (categoryIdString && !categoryIds.includes(categoryIdString)) {
      onCategoryIdsChange([...categoryIds, categoryIdString]);
    }
  };

  // Handle removing a category
  const handleRemoveCategory = (categoryIdString: string) => {
    onCategoryIdsChange(categoryIds.filter((id) => id !== categoryIdString));
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="form-group">
            <Label htmlFor="name" className="form-label">
              Product Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={productName}
              onChange={(e) => onProductNameChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <Label htmlFor="description" className="form-label">
              Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Enter product description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <Label htmlFor="manufacturer" className="form-label">
              Manufacturer
            </Label>
            <select
              id="manufacturer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={manufacturerId}
              onChange={(e) => onManufacturerIdChange(e.target.value)}>
              <option value="">Select manufacturer</option>
              {manufacturers.map((manufacturer) => (
                <option key={manufacturer.id} value={manufacturer.id}>
                  {manufacturer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <Label htmlFor="categories" className="form-label">
              Categories
            </Label>

            {/* Selected Categories */}
            {categoryIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {categoryIds.map((categoryIdString) => (
                  <Badge
                    key={categoryIdString}
                    variant="secondary"
                    className="flex items-center gap-1">
                    {getCategoryName(categoryIdString)}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(categoryIdString)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Category Dropdown */}
            <select
              id="categories"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value=""
              onChange={(e) => handleAddCategory(e.target.value)}>
              <option value="">Select category or subcategory</option>
              {categories.map((category) => (
                <optgroup key={category.id} label={category.name}>
                  {/* Main Category Option */}
                  <option value={category.id}>{category.name}</option>

                  {/* Subcategory Options */}
                  {(category as any).subcategories?.map(
                    (subCategory: SubCategory) => (
                      <option
                        key={subCategory.id}
                        value={createCategoryIdString(
                          category.id,
                          subCategory.id
                        )}>
                        {category.name} &gt;&gt; {subCategory.name}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group">
            <Label htmlFor="tags" className="form-label">
              Product Tags
            </Label>
            <Input
              id="tags"
              placeholder="Enter tags separated by commas"
              value={productTags.join(", ")}
              onChange={(e) =>
                onProductTagsChange(
                  e.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter((tag) => tag)
                )
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Publishing & Display</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              className="h-4 w-4 text-blue-600"
              checked={isPublished}
              onChange={(e) => onIsPublishedChange(e.target.checked)}
            />
            <Label htmlFor="published" className="form-label">
              Is Published
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reviews"
              className="h-4 w-4 text-blue-600"
              checked={allowCustomerReviews}
              onChange={(e) => onAllowCustomerReviewsChange(e.target.checked)}
            />
            <Label htmlFor="reviews" className="form-label">
              Allow Customer Reviews
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="markNew"
              className="h-4 w-4 text-blue-600"
              checked={markAsNew}
              onChange={(e) => onMarkAsNewChange(e.target.checked)}
            />
            <Label htmlFor="markNew" className="form-label">
              Mark as New
            </Label>
          </div>

          <div className="form-group">
            <Label htmlFor="newStartDate" className="form-label">
              Mark as New - Start Date
            </Label>
            <Input
              id="newStartDate"
              type="date"
              value={
                markAsNewStartDate
                  ? new Date(markAsNewStartDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                onMarkAsNewStartDateChange(
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
            />
          </div>

          <div className="form-group">
            <Label htmlFor="newEndDate" className="form-label">
              Mark as New - End Date
            </Label>
            <Input
              id="newEndDate"
              type="date"
              value={
                markAsNewEndDate
                  ? new Date(markAsNewEndDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                onMarkAsNewEndDateChange(
                  e.target.value ? new Date(e.target.value) : undefined
                )
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
