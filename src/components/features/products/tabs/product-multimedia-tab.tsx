"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  X,
  Upload,
  Image as ImageIcon,
  Video,
  GripVertical,
} from "lucide-react";
import Image from "next/image";

// Extended types to include File objects for pending uploads
/**
 * ProductImageWithFile structure:
 * - Existing image: { url: "https://..." }
 * - New image: { url: "", file: File, preview: "blob:..." }
 *
 * The service layer uses this to determine:
 * - Items with url (no file) = keep existing
 * - Items with file = upload new
 * - Old items not in array = delete from storage
 *
 * Note: First image in array is treated as primary image
 */
export interface ProductImageWithFile {
  url: string;
  file?: File;
  preview?: string;
}

/**
 * ProductVideoWithFile structure:
 * - Existing video: { url: "https://..." }
 * - New video file: { url: "", file: File, preview: "blob:..." }
 * - External video: { url: "https://youtube.com/..." }
 * - Removed video: null
 */
export interface ProductVideoWithFile {
  url: string;
  file?: File;
  preview?: string;
}

interface ProductMultimediaTabProps {
  images: ProductImageWithFile[];
  onImagesChange: (value: ProductImageWithFile[]) => void;
  video?: ProductVideoWithFile | null;
  onVideoChange?: (value: ProductVideoWithFile | null) => void;
}

export function ProductMultimediaTab({
  images,
  onImagesChange,
  video,
  onVideoChange,
}: ProductMultimediaTabProps) {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState(video?.url || "");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const removeImage = (index: number) => {
    const removedImage = images[index];
    const newImages = images.filter((_, i) => i !== index);

    // Clean up preview URLs
    if (removedImage.preview) {
      URL.revokeObjectURL(removedImage.preview);
    }

    onImagesChange(newImages);
  };

  // Drag and drop for reordering images
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];

    // Remove dragged item
    newImages.splice(draggedIndex, 1);
    // Insert at new position
    newImages.splice(index, 0, draggedImage);

    setDraggedIndex(index);
    onImagesChange(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  // File validation for images
  const handleImageFileValidation = (file: File): boolean => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return false;
    }
    return true;
  };

  // File validation for videos
  const handleVideoFileValidation = (file: File): boolean => {
    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      return false;
    }
    return true;
  };

  // Store image files locally with preview
  const handleImageFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(handleImageFileValidation);
    if (validFiles.length === 0) return;

    const newImages: ProductImageWithFile[] = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      return {
        url: "", // Will be set after upload
        file,
        preview,
      };
    });

    onImagesChange([...images, ...newImages]);
  };

  // Image drag and drop handlers
  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(true);
  };

  const handleImageDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(false);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImages(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleImageFiles(files);
    }
  };

  // Handle image file input change
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageFiles(files);
    }
  };

  // Store video file locally with preview
  const handleVideoFile = (file: File) => {
    if (!handleVideoFileValidation(file)) return;

    const preview = URL.createObjectURL(file);
    if (onVideoChange) {
      onVideoChange({
        url: "", // Will be set after upload
        file,
        preview,
      });
    }
  };

  // Video drag and drop handlers
  const handleVideoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  };

  const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleVideoFile(file);
    }
  };

  // Handle video file input change
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleVideoFile(file);
    }
  };

  const handleRemoveVideo = () => {
    if (video?.preview) {
      URL.revokeObjectURL(video.preview);
    }
    if (onVideoChange) {
      onVideoChange(null);
    }
    setVideoUrlInput("");
  };

  // Handle video URL input change
  const handleVideoUrlChange = (url: string) => {
    setVideoUrlInput(url);
    if (onVideoChange) {
      onVideoChange(url ? { url } : null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 mb-6">
              <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2 text-lg">
                No images added yet
              </p>
              <p className="text-sm text-gray-500">
                Upload files below to add product images
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mb-6">
              {images.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative group border-2 rounded-lg overflow-hidden transition-all cursor-move ${
                    index === 0
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  } ${draggedIndex === index ? "opacity-50" : ""}`}>
                  {/* Image Container */}
                  <div className="aspect-square bg-gray-100 relative">
                    {(image.preview || image.url) && !imageErrors[index] ? (
                      <Image
                        src={image.preview || image.url}
                        alt={`Product image ${index + 1}`}
                        fill
                        className="object-cover"
                        onError={() => handleImageError(index)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}

                    {/* Primary Badge - First image is always primary */}
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-semibold shadow-md">
                        Primary
                      </div>
                    )}

                    {/* Drag Handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Image Number */}
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs font-medium">
                      #{index + 1}
                    </div>

                    {/* Delete Button - Shows on hover */}
                    <Button
                      type="button"
                      onClick={() => removeImage(index)}
                      variant="destructive"
                      size="sm"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDraggingImages
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-1">Upload images from your device</p>
            <p className="text-xs text-gray-500 mb-3">
              Drag & drop images here or click to browse
            </p>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("image-upload")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Supports: JPG, PNG, GIF, WebP (Max 5MB per image)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Video</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-t pt-4">
              <Label className="text-sm font-medium mb-2 block">
                Upload Video File
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDraggingVideo
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
                onDragOver={handleVideoDragOver}
                onDragLeave={handleVideoDragLeave}
                onDrop={handleVideoDrop}>
                {video?.preview || video?.url ? (
                  <div className="relative">
                    <video
                      src={video.preview || video.url}
                      className="w-full max-h-64 rounded-lg mx-auto"
                      controls
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-1">
                      Upload a video from your device
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      Drag & drop video here or click to browse
                    </p>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("video-upload")?.click()
                      }>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Video
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Supports: MP4, WebM, MOV (Max 50MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
