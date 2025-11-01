"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  Package,
  Eye,
  FolderOpen,
  Calendar,
  User,
  BarChart3,
  Plus,
} from "lucide-react";
import type { Category, SubCategory, Product } from "@/types";
import categoryService from "@/services/categoryService";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { LinkButton } from "@/components/ui/link-button";

const DEFAULT_CATEGORY_IMAGE = "/images/default-category.svg";
const DEFAULT_PRODUCT_IMAGE = "/images/default-product.svg";

interface CategoryEditFormProps {
  category: Category;
  subCategory: SubCategory | null;
  subCategories: SubCategory[];
  products: Product[];
  isSubCategory: boolean;
}

export function CategoryEditForm({
  category,
  subCategory,
  subCategories,
  products,
  isSubCategory,
}: CategoryEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Use different form data based on whether it's a category or subcategory
  const [formData, setFormData] = useState(
    isSubCategory && subCategory
      ? {
          name: subCategory.name,
          description: subCategory.description || "",
          picture: subCategory.picture || "",
          displayOrder: subCategory.displayOrder,
          isPublished: subCategory.isPublished,
        }
      : {
          name: category.name,
          description: category.description || "",
          type: category.type,
          picture: category.picture || "",
          displayOrder: category.displayOrder,
          isPublished: category.isPublished,
          showOnHomepage: category.showOnHomepage || false,
          showOnNavbar: category.showOnNavbar || false,
        }
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert(
        `Please enter a ${isSubCategory ? "subcategory" : "category"} name`
      );
      return;
    }

    try {
      setSaving(true);

      if (isSubCategory && subCategory) {
        // Update subcategory
        await categoryService.updateSubCategory(
          category.id,
          subCategory.id,
          formData
        );
      } else {
        // Update main category
        await categoryService.updateCategory(category.id, formData);
      }

      setIsEditing(false);
      alert(
        `${isSubCategory ? "Subcategory" : "Category"} updated successfully!`
      );
      router.refresh();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : `Failed to update ${isSubCategory ? "subcategory" : "category"}`
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(
      isSubCategory && subCategory
        ? {
            name: subCategory.name,
            description: subCategory.description || "",
            picture: subCategory.picture || "",
            displayOrder: subCategory.displayOrder,
            isPublished: subCategory.isPublished,
          }
        : {
            name: category.name,
            description: category.description || "",
            type: category.type,
            picture: category.picture || "",
            displayOrder: category.displayOrder,
            isPublished: category.isPublished,
            showOnHomepage: category.showOnHomepage || false,
            showOnNavbar: category.showOnNavbar || false,
          }
    );
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isSubCategory ? (
            <Link href={`/dashboard/categories/${category.id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {category.name}
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/categories">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Categories
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isEditing
                ? `Edit ${isSubCategory ? "Subcategory" : "Category"}`
                : isSubCategory && subCategory
                ? subCategory.name
                : category.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditing
                ? `Update ${isSubCategory ? "subcategory" : "category"} details`
                : isSubCategory
                ? `Subcategory under ${category.name}`
                : "View and manage category"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !formData.name.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit {isSubCategory ? "Subcategory" : "Category"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Category Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{isSubCategory ? "Subcategory" : "Category"} Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder={`Enter ${
                      isSubCategory ? "subcategory" : "category"
                    } name`}
                  />
                ) : (
                  <p className="mt-1 text-lg font-medium">
                    {isSubCategory && subCategory
                      ? subCategory.name
                      : category.name}
                  </p>
                )}
              </div>

              {/* Display Parent Category (Read-only) */}
              {isSubCategory && (
                <div>
                  <Label>Main Category</Label>
                  <div className="mt-1">
                    <Link href={`/dashboard/categories/${category.id}`}>
                      <Badge
                        variant="default"
                        className="cursor-pointer hover:bg-blue-600">
                        {category.name}
                      </Badge>
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <Label>Slug</Label>
                <p className="mt-1 text-gray-600 font-mono text-sm">
                  {isSubCategory && subCategory
                    ? subCategory.slug
                    : category.slug}
                </p>
              </div>

              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={`Enter ${
                      isSubCategory ? "subcategory" : "category"
                    } description`}
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-gray-600">
                    {isSubCategory && subCategory
                      ? subCategory.description || "No description"
                      : category.description || "No description"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isSubCategory && (
                  <div>
                    <Label>Type</Label>
                    {isEditing ? (
                      <select
                        value={(formData as any).type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            type: e.target.value as "simple" | "special",
                          } as any)
                        }
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md">
                        <option value="simple">Simple</option>
                        <option value="special">Special</option>
                      </select>
                    ) : (
                      <Badge variant="default" className="mt-1">
                        {category.type}
                      </Badge>
                    )}
                  </div>
                )}

                <div>
                  <Label>Display Order</Label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayOrder: parseInt(e.target.value) || 1,
                        })
                      }
                      min={1}
                    />
                  ) : (
                    <p className="mt-1 text-gray-600">
                      {isSubCategory && subCategory
                        ? subCategory.displayOrder
                        : category.displayOrder}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Picture URL</Label>
                {isEditing ? (
                  <Input
                    value={formData.picture}
                    onChange={(e) =>
                      setFormData({ ...formData, picture: e.target.value })
                    }
                    placeholder="Enter image URL"
                  />
                ) : (
                  <p className="mt-1 text-gray-600 break-all">
                    {category.picture || "No image"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products in this Category
                </CardTitle>
                <Badge variant="secondary">
                  {products.length} product{products.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {products.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                product.multimedia?.images[0]?.url ||
                                DEFAULT_PRODUCT_IMAGE
                              }
                              alt={product.info.name}
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                              }}
                            />
                            <div>
                              <p className="font-medium">{product.info.name}</p>
                              <p className="text-sm text-gray-500 truncate max-w-[300px]">
                                {product.info.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.inventory.stockQuantity >
                              product.inventory.minimumStockQuantity
                                ? "success"
                                : "warning"
                            }>
                            {product.inventory.stockQuantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.info.isPublished ? "success" : "secondary"
                            }>
                            {product.info.isPublished ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/dashboard/products/${product.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No products in this category yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subcategories Card - Only show for main categories */}
          {!isSubCategory && subCategories && subCategories.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Subcategories
                  </CardTitle>
                  <LinkButton
                    href="/dashboard/categories/add"
                    variant="default"
                    size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </LinkButton>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {subCategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/dashboard/categories/${category.id}?sub=${sub.id}`}>
                      <div className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-sm text-gray-500">
                              {sub.productIds?.length || 0} products
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Image & Settings */}
        <div className="space-y-6">
          {/* Category Image Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isSubCategory ? "Subcategory" : "Category"} Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={
                    isEditing
                      ? formData.picture || DEFAULT_CATEGORY_IMAGE
                      : isSubCategory && subCategory
                      ? subCategory.picture || DEFAULT_CATEGORY_IMAGE
                      : category.picture || DEFAULT_CATEGORY_IMAGE
                  }
                  alt={
                    isSubCategory && subCategory
                      ? subCategory.name
                      : category.name
                  }
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status & Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Published</Label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isPublished: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                ) : (
                  <Badge
                    variant={
                      (
                        isSubCategory && subCategory
                          ? subCategory.isPublished
                          : category.isPublished
                      )
                        ? "success"
                        : "secondary"
                    }>
                    {(
                      isSubCategory && subCategory
                        ? subCategory.isPublished
                        : category.isPublished
                    )
                      ? "Published"
                      : "Unpublished"}
                  </Badge>
                )}
              </div>

              {!isSubCategory && (
                <>
                  <div className="flex items-center justify-between">
                    <Label>Show on Homepage</Label>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={(formData as any).showOnHomepage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            showOnHomepage: e.target.checked,
                          } as any)
                        }
                        className="w-4 h-4"
                      />
                    ) : (
                      <Badge
                        variant={
                          category.showOnHomepage ? "success" : "secondary"
                        }>
                        {category.showOnHomepage ? "Yes" : "No"}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show on Navbar</Label>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={(formData as any).showOnNavbar}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            showOnNavbar: e.target.checked,
                          } as any)
                        }
                        className="w-4 h-4"
                      />
                    ) : (
                      <Badge
                        variant={
                          category.showOnNavbar ? "success" : "secondary"
                        }>
                        {category.showOnNavbar ? "Yes" : "No"}
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Products</span>
                <Badge variant="default">
                  {isSubCategory && subCategory
                    ? subCategory.productIds?.length || 0
                    : category.productIds?.length || 0}
                </Badge>
              </div>
              {!isSubCategory && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subcategories</span>
                  <Badge variant="default">
                    {category.subCategoryCount || 0}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-gray-500">Created</Label>
                <p className="mt-1">
                  {new Date(
                    isSubCategory && subCategory
                      ? subCategory.createdAt
                      : category.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {isSubCategory && subCategory
                    ? subCategory.createdBy || "N/A"
                    : category.createdBy || "N/A"}
                </p>
              </div>
              <div className="pt-3 border-t">
                <Label className="text-xs text-gray-500">Last Updated</Label>
                <p className="mt-1">
                  {new Date(
                    isSubCategory && subCategory
                      ? subCategory.updatedAt
                      : category.updatedAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {isSubCategory && subCategory
                    ? subCategory.updatedBy || "N/A"
                    : category.updatedBy || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
