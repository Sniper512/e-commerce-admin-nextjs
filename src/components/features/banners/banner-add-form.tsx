"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react";
import bannerService from "@/services/bannerService";
import type { Product } from "@/types";
import { ProductSearchDropdown } from "../products/product-search-dropdown";
import { CategorySearchDropdown } from "../categories/category-search-dropdown";
import { useToast } from "@/components/ui/toast-context";
import Image from "next/image";

interface BannerAddFormProps {
  products: Product[];
}

export default function BannerAddForm({ products }: BannerAddFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    bannerType: "homepage" as "popup" | "homepage",
    linkType: "category" as "category" | "product",
    link: "",
    isActive: true,
    displayOrder: "" as string | number,
  });

  const handleFileValidation = (file: File): boolean => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFilePreview = (file: File) => {
    setImageFile(file);
    setError(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!imageFile) {
      setError("Please select an image");
      return;
    }

    if (!formData.link.trim()) {
      setError("Please select a link destination");
      return;
    }

    setLoading(true);

    try {
      await bannerService.createBanner(
        {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          bannerType: formData.bannerType,
          linkType: formData.linkType,
          link: formData.link,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder as number,
          createdAt: new Date(),
        },
        imageFile
      );

      showToast("success", "Banner created successfully!");
      router.push("/dashboard/banners");
      router.refresh();
    } catch (error: any) {
      setError(error.message || "Failed to create banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LinkButton href="/dashboard/banners" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Banners
            </LinkButton>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Add New Banner
              </h1>
              <p className="text-gray-500 mt-1">
                Create a new banner for your store
              </p>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Banner
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter banner title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter banner description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bannerType">Banner Type *</Label>
                    <Select
                      id="bannerType"
                      value={formData.bannerType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bannerType: e.target.value as "popup" | "homepage",
                        })
                      }
                      required>
                      <option value="homepage">Homepage Banner</option>
                      <option value="popup">Popup Banner</option>
                    </Select>
                    {formData.bannerType === "popup" && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Only one popup banner can be active at a time
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="displayOrder">Display Order *</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      min="1"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayOrder:
                            e.target.value === ""
                              ? ""
                              : parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Link Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Link Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkType">Link Type *</Label>
                  <Select
                    id="linkType"
                    value={formData.linkType}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        linkType: e.target.value as "category" | "product",
                        link: "",
                      });
                      setCategorySearch("");
                      setProductSearch("");
                    }}
                    required>
                    <option value="category">Category</option>
                    <option value="product">Product</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="link">
                    {formData.linkType === "category"
                      ? "Select Category *"
                      : "Select Product *"}
                  </Label>
                  {formData.linkType === "category" ? (
                    <CategorySearchDropdown
                      onSelect={(categoryId) =>
                        setFormData({ ...formData, link: categoryId })
                      }
                      searchValue={categorySearch}
                      onSearchChange={setCategorySearch}
                      placeholder="Search for a category..."
                    />
                  ) : (
                    <ProductSearchDropdown
                      selectedProductId={formData.link}
                      onSelect={(product) =>
                        setFormData({ ...formData, link: product.id })
                      }
                      searchValue={productSearch}
                      onSearchChange={setProductSearch}
                      placeholder="Search for a product..."
                      defaultProductImage="/images/default-product.png"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Image Upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Banner Image *</CardTitle>
              </CardHeader>
              <CardContent>
                {!imagePreview ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Maximum file size: 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button type="button" variant="outline">
                        Select Image
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Banner preview"
                        className="w-full h-64 object-contain rounded-lg"
                        width={400}
                        height={256}
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      Click the X button to remove and select a different image
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </form>
  );
}
