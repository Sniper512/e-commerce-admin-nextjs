"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/types";

interface ProductInfoTabProps {
  productName: string;
  onProductNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  categoryId: string;
  onCategoryIdChange: (value: string) => void;
  categories: Category[];
  manufacturer: string;
  onManufacturerChange: (value: string) => void;
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
  categoryId,
  onCategoryIdChange,
  categories,
  manufacturer,
  onManufacturerChange,
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
            <Input
              id="manufacturer"
              placeholder="Enter manufacturer name"
              value={manufacturer}
              onChange={(e) => onManufacturerChange(e.target.value)}
            />
          </div>

          <div className="form-group">
            <Label htmlFor="categories" className="form-label">
              Categories
            </Label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryId}
              onChange={(e) => onCategoryIdChange(e.target.value)}>
              <option value="">Select categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
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
                  ? markAsNewStartDate.toISOString().split("T")[0]
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
                  ? markAsNewEndDate.toISOString().split("T")[0]
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
