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
} from "lucide-react";
import type { Manufacturer } from "@/types";
import manufacturerService from "@/services/manufacturerService";

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

  const [formData, setFormData] = useState({
    name: manufacturer.name,
    description: manufacturer.description || "",
    logo: manufacturer.logo || "",
    displayOrder: manufacturer.displayOrder,
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a manufacturer name");
      return;
    }

    try {
      setSaving(true);
      await manufacturerService.updateManufacturer(manufacturer.id, formData);
      setIsEditing(false);
      alert("Manufacturer updated successfully!");
      router.refresh();
    } catch (err) {
      alert(
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
      logo: manufacturer.logo || "",
      displayOrder: manufacturer.displayOrder,
    });
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

        {/* Right Column - Logo & Metadata */}
        <div className="space-y-6">
          {/* Logo Card */}
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={
                      isEditing
                        ? formData.logo || DEFAULT_LOGO
                        : manufacturer.logo || DEFAULT_LOGO
                    }
                    alt={manufacturer.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_LOGO;
                    }}
                  />
                </div>
                {isEditing && (
                  <div>
                    <Label>Logo URL</Label>
                    <Input
                      value={formData.logo}
                      onChange={(e) =>
                        setFormData({ ...formData, logo: e.target.value })
                      }
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                )}
              </div>
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
                  {new Date(manufacturer.createdAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {manufacturer.createdBy || "N/A"}
                </p>
              </div>
              <div className="pt-3 border-t">
                <Label className="text-xs text-gray-500">Last Updated</Label>
                <p className="mt-1">
                  {new Date(manufacturer.updatedAt).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }
                  )}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <User className="h-3 w-3" />
                  {manufacturer.updatedBy || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
