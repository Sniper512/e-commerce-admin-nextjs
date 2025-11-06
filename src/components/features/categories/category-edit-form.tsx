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
  Upload,
} from "lucide-react";
import type { Category, SubCategory, Product } from "@/types";
import categoryService from "@/services/categoryService";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { LinkButton } from "@/components/ui/link-button";
import Image from "next/image";

const DEFAULT_CATEGORY_IMAGE = "/images/default-image.svg";
const DEFAULT_PRODUCT_IMAGE = "/images/default-image.svg";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Use different form data based on whether it's a category or subcategory
  const [formData, setFormData] = useState(
    isSubCategory && subCategory
      ? {
          name: subCategory.name,
          description: subCategory.description || "",
          image: subCategory.image || "",
          displayOrder: subCategory.displayOrder,
          isActive: subCategory.isActive,
        }
      : {
          name: category.name,
          description: category.description || "",
          type: category.type,
          image: category.image || "",
          displayOrder: category.displayOrder,
          isActive: category.isActive,
          showOnHomepage: category.showOnHomepage || false,
          showOnNavbar: category.showOnNavbar || false,
        }
  );

  const handleFileValidation = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFilePreview = (file: File) => {
    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && handleFileValidation(file)) {
      handleFilePreview(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isEditing) return;

    const file = e.dataTransfer.files?.[0];
    if (file && handleFileValidation(file)) {
      handleFilePreview(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

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
          formData,
          imageFile
        );
      } else {
        // Update main category
        await categoryService.updateCategory(category.id, formData, imageFile);
      }

      setIsEditing(false);
      setImageFile(null);
      setImagePreview("");
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
            image: subCategory.image || "",
            displayOrder: subCategory.displayOrder,
            isActive: subCategory.isActive,
          }
        : {
            name: category.name,
            description: category.description || "",
            type: category.type,
            image: category.image || "",
            displayOrder: category.displayOrder,
            isActive: category.isActive,
            showOnHomepage: category.showOnHomepage || false,
            showOnNavbar: category.showOnNavbar || false,
          }
    );
    setImageFile(null);
    setImagePreview("");
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
                      <div className="mt-2">
                        <Badge variant="default">{category.type}</Badge>
                      </div>
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
                            <Image
                              src={
                                product.multimedia?.images[0] ||
                                DEFAULT_PRODUCT_IMAGE
                              }
                              alt={product.info.name}
                              className="w-10 h-10 object-cover rounded border"
                              width={40}
                              height={40}
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
                              product.info.isActive ? "success" : "secondary"
                            }>
                            {product.info.isActive ? "Active" : "Inactive"}
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
              <div className="space-y-4">
                <div
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative border-2 ${
                    isEditing
                      ? isDragging
                        ? "border-dashed border-blue-500 bg-blue-50"
                        : "border-dashed border-gray-300"
                      : "border-solid border-gray-200"
                  } transition-colors`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}>
                  {imagePreview ||
                  (isSubCategory && subCategory
                    ? subCategory.image
                    : category.image) ? (
                    <>
                      <Image
                        src={
                          imagePreview ||
                          (isSubCategory && subCategory
                            ? subCategory.image
                            : category.image) ||
                          DEFAULT_CATEGORY_IMAGE
                        }
                        alt={
                          isSubCategory && subCategory
                            ? subCategory.name
                            : category.name
                        }
                        className="w-full h-full object-contain p-4"
                        width={300}
                        height={300}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                        }}
                      />
                      {isEditing && imagePreview && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        {isEditing
                          ? "Drag and drop image here"
                          : "No image uploaded"}
                      </p>
                      {isEditing && (
                        <p className="text-xs text-gray-500">
                          or click below to browse
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <Label htmlFor="category-image-edit">
                      Upload New Image
                    </Label>
                    <div className="mt-2">
                      <input
                        id="category-image-edit"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          document
                            .getElementById("category-image-edit")
                            ?.click()
                        }>
                        <Upload className="h-4 w-4 mr-2" />
                        {imageFile ? "Change Image" : "Upload New Image"}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Recommended: Square image, max 5MB
                    </p>
                  </div>
                )}
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
                <Label>Status</Label>
                {isEditing ? (
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                ) : (
                  <Badge
                    variant={
                      (
                        isSubCategory && subCategory
                          ? subCategory.isActive
                          : category.isActive
                      )
                        ? "success"
                        : "secondary"
                    }>
                    {(
                      isSubCategory && subCategory
                        ? subCategory.isActive
                        : category.isActive
                    )
                      ? "Active"
                      : "Inactive"}
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
