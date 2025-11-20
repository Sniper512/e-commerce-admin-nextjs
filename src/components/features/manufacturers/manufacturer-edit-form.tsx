"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  Calendar,
  User,
  Upload,
} from "lucide-react";
import type { Manufacturer } from "@/types";
import manufacturerService from "@/services/manufacturerService";
import Image from "next/image";
import { useToast } from "@/components/ui/toast-context";

const DEFAULT_LOGO = "/images/default-manufacturer.svg";

interface ManufacturerEditFormProps {
  manufacturer: Manufacturer;
}

export function ManufacturerEditForm({
  manufacturer,
}: ManufacturerEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const {showToast} = useToast()

  const [formData, setFormData] = useState({
    name: manufacturer.name,
    description: manufacturer.description || "",
    displayOrder: manufacturer.displayOrder,
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
    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("error","Please enter a manufacturer name");
      return;
    }

    try {
      setSaving(true);
      await manufacturerService.updateManufacturer(
        manufacturer.id,
        formData,
        logoFile
      );
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview("");
      showToast("success","Manufacturer updated successfully!");
      router.refresh();
    } catch (err) {
      showToast("error",
        err instanceof Error ? err.message : "Failed to update manufacturer"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: manufacturer.name,
      description: manufacturer.description || "",
      displayOrder: manufacturer.displayOrder,
    });
    setLogoFile(null);
    setLogoPreview("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/manufacturers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Manufacturers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {isEditing ? "Edit Manufacturer" : manufacturer.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {isEditing
                ? "Update manufacturer details"
                : "View and manage manufacturer"}
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
              Edit Manufacturer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Manufacturer Name</Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter manufacturer name"
                  />
                ) : (
                  <p className="mt-1 text-lg font-medium">
                    {manufacturer.name}
                  </p>
                )}
              </div>

              <div>
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter manufacturer description"
                    rows={4}
                  />
                ) : (
                  <p className="mt-1 text-gray-600">
                    {manufacturer.description || "No description"}
                  </p>
                )}
              </div>

              <div>
                <Label>Display Order</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                ) : (
                  <p className="mt-1 text-gray-600">
                    {manufacturer.displayOrder}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Products</span>
                <Badge variant="default">
                  {manufacturer.productCount || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logo Card */}
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
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
                {logoPreview || manufacturer.logo ? (
                  <>
                    <Image
                      src={logoPreview || manufacturer.logo || DEFAULT_LOGO}
                      alt={manufacturer.name}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_LOGO;
                      }}
                      width={300}
                      height={300}
                    />
                    {isEditing && logoPreview && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
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
                        ? "Drag and drop logo here"
                        : "No logo uploaded"}
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
                  <Label htmlFor="logo-edit">Upload New Logo</Label>
                  <div className="mt-2">
                    <input
                      id="logo-edit"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        document.getElementById("logo-edit")?.click()
                      }>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoFile ? "Change Logo" : "Upload New Logo"}
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
      </div>
    </div>
  );
}
