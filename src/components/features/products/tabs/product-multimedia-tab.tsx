"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus, Upload, Image as ImageIcon } from "lucide-react";
import type { ProductImage } from "@/types";

interface ProductMultimediaTabProps {
  images: ProductImage[];
  onImagesChange: (value: ProductImage[]) => void;
}

export function ProductMultimediaTab({
  images,
  onImagesChange,
}: ProductMultimediaTabProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const addImageUrl = () => {
    onImagesChange([
      ...images,
      {
        url: "",
        isPrimary: images.length === 0,
        sortOrder: images.length,
      },
    ]);
  };

  const removeImage = (url: string) => {
    onImagesChange(images.filter((img) => img.url !== url));
    // Clean up error state
    const newErrors = { ...imageErrors };
    delete newErrors[url];
    setImageErrors(newErrors);
  };

  const updateImage = (
    url: string,
    field: "url" | "altText" | "isPrimary" | "sortOrder",
    value: string | boolean | number
  ) => {
    // Reset error state when URL changes
    if (field === "url") {
      setImageErrors((prev) => ({ ...prev, [url]: false }));
    }

    const updated = images.map((img) => {
      if (img.url === url) {
        if (field === "isPrimary" && value === true) {
          // Make this primary and unset others
          return { ...img, [field]: value };
        }
        return { ...img, [field]: value };
      } else if (field === "isPrimary" && value === true) {
        // Unset isPrimary on other images
        return { ...img, isPrimary: false };
      }
      return img;
    });
    onImagesChange(updated);
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Images
            <Button onClick={addImageUrl} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {images.map((image, index) => (
              <div
                key={image.url}
                className="flex items-start gap-4 p-4 border rounded-lg bg-white">
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-gray-200">
                    {image.url && !imageErrors[image.url] ? (
                      <img
                        src={image.url}
                        alt={"Product image"}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(image.url)}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    #{index + 1}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label
                      htmlFor={`url-${image.url}`}
                      className="text-sm font-medium">
                      Image URL *
                    </Label>
                    <Input
                      id={`url-${image.url}`}
                      placeholder="https://example.com/image.jpg"
                      value={image.url}
                      onChange={(e) =>
                        updateImage(image.url, "url", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={image.isPrimary}
                      onChange={(e) =>
                        updateImage(image.url, "isPrimary", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      Set as Primary Image
                    </span>
                  </label>
                </div>
                <Button
                  onClick={() => removeImage(image.url)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {images.length === 0 && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">
                  No images added yet
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Click "Add Image" button above to add product images via URL
                </p>
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">
                Upload images from your device
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Drag & drop images here or click to browse
              </p>
              <Button variant="outline" size="sm" disabled>
                Choose Files
              </Button>
              <p className="text-xs text-gray-500 mt-2 italic">
                File upload coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="form-group">
              <Label htmlFor="videoUrl" className="form-label">
                Video URL
              </Label>
              <Input
                id="videoUrl"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
