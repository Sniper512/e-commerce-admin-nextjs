"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, Upload, X } from "lucide-react";
import manufacturerService from "@/services/manufacturerService";
import Image from "next/image";

export function ManufacturerAddForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    displayOrder: 1,
  });

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

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a manufacturer name");
      return;
    }

    try {
      setLoading(true);
      await manufacturerService.createManufacturer(formData, logoFile);
      alert("Manufacturer created successfully!");
      router.push("/dashboard/manufacturers");
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error creating manufacturer"
      );
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
            <Link href="/dashboard/manufacturers">
              <Button variant="outline" size="sm" type="button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Manufacturers
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Add New Manufacturer</h1>
              <p className="text-gray-500 mt-1">
                Create a new manufacturer for your products
              </p>
            </div>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Manufacturer
              </>
            )}
          </Button>
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
                  <Label htmlFor="name">
                    Manufacturer Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter manufacturer name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter manufacturer description"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="displayOrder">Display Order</Label>
                  <Input
                    id="displayOrder"
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
                  <p className="text-sm text-gray-500 mt-1">
                    Lower numbers appear first
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Logo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
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
                    {logoPreview ? (
                      <>
                        <Image
                          src={logoPreview}
                          alt="Manufacturer logo"
                          className="w-full h-full object-contain p-4"
                          width={300}
                          height={300}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Drag and drop logo here
                        </p>
                        <p className="text-xs text-gray-500">
                          or click below to browse
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="logo">Upload Logo</Label>
                    <div className="mt-2">
                      <input
                        id="logo"
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
                          document.getElementById("logo")?.click()
                        }>
                        <Upload className="h-4 w-4 mr-2" />
                        {logoFile ? "Change Logo" : "Upload Logo"}
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
    </form>
  );
}
