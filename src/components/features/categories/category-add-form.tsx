"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  Settings,
  Info,
  X,
} from "lucide-react";
import Link from "next/link";
import categoryService from "@/services/categoryService";
import type { Category } from "@/types";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-context";

interface CategoryAddFormProps {
  categories: Category[];
}

export function CategoryAddForm({ categories }: CategoryAddFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubCategory, setIsSubCategory] = useState(false);
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const{showToast} = useToast()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "simple" as "simple" | "special",
    displayOrder: 1,
    isActive: true,
    showOnHomepage: false,
    showOnNavbar: true,
  });

  const handleFileValidation = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("error","Please select an image file");
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("error","Image size must be less than 5MB");
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
    setIsDragging(true);
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

    const file = e.dataTransfer.files?.[0];
    if (file && handleFileValidation(file)) {
      handleFilePreview(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      showToast("error","Please enter a category name");
      return;
    }

    if (isSubCategory && !parentCategoryId) {
      showToast("error","Please select a parent category");
      return;
    }

    try {
      setLoading(true);

      if (isSubCategory && parentCategoryId) {
        // Create subcategory
        const subCategoryData = {
          name: formData.name,
          description: formData.description,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          productIds: [],
        };

        await categoryService.createSubCategory(
          parentCategoryId,
          subCategoryData,
          imageFile
        );
        showToast("success","Subcategory created successfully!");
      } else {
        // Create root category
        const categoryData = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          displayOrder: formData.displayOrder,
          isActive: formData.isActive,
          showOnHomepage: formData.showOnHomepage,
          showOnNavbar: formData.showOnNavbar,
          productIds: [],
        };

        await categoryService.createCategory(categoryData, imageFile);
        showToast("success","Category created successfully!");
      }

      router.push("/dashboard/categories");
    } catch (error) {
      showToast("error","Error saving category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Add New Category</h1>
            <p className="text-gray-600">
              Create a new category to organize your products
            </p>
          </div>
        </div>
        <Button
          onClick={handleSaveCategory}
          disabled={loading || !formData.name.trim()}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Category
            </>
          )}
        </Button>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Category Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Category Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Type Toggle */}
              <div>
                <Label className="text-sm font-medium">Category Level</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryLevel"
                      checked={!isSubCategory}
                      onChange={() => {
                        setIsSubCategory(false);
                        setParentCategoryId("");
                      }}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Main Category</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="categoryLevel"
                      checked={isSubCategory}
                      onChange={() => setIsSubCategory(true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>Sub-Category</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isSubCategory
                    ? "Sub-categories are nested under main categories"
                    : "Main categories can have sub-categories"}
                </p>
              </div>

              {/* Parent Category Selection - Only shown for subcategories */}
              {isSubCategory && (
                <div>
                  <Label
                    htmlFor="parentCategory"
                    className="text-sm font-medium">
                    Parent Category *
                  </Label>
                  <select
                    id="parentCategory"
                    value={parentCategoryId}
                    onChange={(e) => setParentCategoryId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a parent category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                        {cat.subCategoryCount > 0
                          ? ` (${cat.subCategoryCount} sub-categories)`
                          : ""}
                      </option>
                    ))}
                  </select>

                  {/* Info about nesting limit */}
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p>
                        The system supports only 2 levels: Main Category →
                        Sub-Category. Sub-categories cannot have further
                        nesting.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Category Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter category name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Category description"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Category Type - Only for root categories */}
              {!isSubCategory && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type" className="text-sm font-medium">
                      Category Type
                    </Label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          type: e.target.value as "simple" | "special",
                        }))
                      }
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="simple">Simple</option>
                      <option value="special">Special</option>
                    </select>
                  </div>

                  <div>
                    <Label
                      htmlFor="displayOrder"
                      className="text-sm font-medium">
                      Display Order
                    </Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          displayOrder: parseInt(e.target.value) || 1,
                        }))
                      }
                      min="1"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              {/* Display Order for subcategories */}
              {isSubCategory && (
                <div>
                  <Label htmlFor="displayOrder" className="text-sm font-medium">
                    Display Order
                  </Label>
                  <Input
                    id="displayOrder"
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value) || 1,
                      }))
                    }
                    min="1"
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publication Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publication Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium">Category Active</span>
                  <p className="text-sm text-gray-500">
                    Make this {isSubCategory ? "sub-category" : "category"}{" "}
                    visible to customers
                  </p>
                </div>
              </label>

              {!isSubCategory && (
                <>
                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showOnHomepage}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          showOnHomepage: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show on Homepage</span>
                      <p className="text-sm text-gray-500">
                        Display on homepage
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showOnNavbar}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          showOnNavbar: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium">Show on Navbar</span>
                      <p className="text-sm text-gray-500">
                        Include in navigation menu
                      </p>
                    </div>
                  </label>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Image Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative border-2 border-dashed transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}>
                  {imagePreview ? (
                    <>
                      <Image
                        src={imagePreview}
                        alt="Category preview"
                        className="w-full h-full object-contain p-4"
                        width={300}
                        height={300}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Drag and drop image here
                      </p>
                      <p className="text-xs text-gray-500">
                        or click below to browse
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="picture">Upload Image</Label>
                  <div className="mt-2">
                    <input
                      id="picture"
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
                        document.getElementById("picture")?.click()
                      }>
                      <Upload className="h-4 w-4 mr-2" />
                      {imageFile ? "Change Image" : "Upload Image"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Recommended: Square image, max 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
