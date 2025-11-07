"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import batchService from "@/services/batchService";
import type { Batch, Product } from "@/types";
import {
  ArrowLeft,
  Trash2,
  Package,
  Calendar,
  MapPin,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  Box,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BatchDetailProps {
  batch: Batch;
  product: Product | null;
}

export function BatchDetail({ batch, product }: BatchDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  // Calculate expiry info once
  const now = new Date();
  const expDate =
    typeof batch.expiryDate === "string"
      ? new Date(batch.expiryDate)
      : batch.expiryDate;
  const daysUntilExpiry = Math.ceil(
    (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete batch "${batch.batchId}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await batchService.deleteBatch(batch.id);
      alert("Batch deleted successfully");
      router.push("/dashboard/batches");
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch");
      setDeleting(false);
    }
  };

  const utilizationPercentage = Math.round(
    ((batch.quantity - batch.remainingQuantity) / batch.quantity) * 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/batches">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
          </Link>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}>
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Warning if expiring soon or expired */}
      {isExpired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>This batch expired {Math.abs(daysUntilExpiry)} days ago</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isExpiringSoon && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>This batch will expire in {daysUntilExpiry} days</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batch Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Batch Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Batch ID</p>
              <p className="font-mono font-semibold">{batch.batchId}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Product</p>
              <p className="font-medium">{product?.info.name || "N/A"}</p>
              {product && (
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="text-sm text-blue-600 hover:underline">
                  View Product Details →
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Manufacturing Date
                </p>
                <p className="font-medium">
                  {formatDate(batch.manufacturingDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Expiry Date
                </p>
                <p className="font-medium">{formatDate(batch.expiryDate)}</p>
              </div>
            </div>

            {batch.supplier && (
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  Supplier
                </p>
                <p className="font-medium">{batch.supplier}</p>
              </div>
            )}

            {batch.location && (
              <div>
                <p className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Storage Location
                </p>
                <p className="font-medium">{batch.location}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantity & Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Box className="h-5 w-5 mr-2" />
              Quantity & Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-3xl font-bold">{batch.quantity}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Remaining Quantity</p>
              <p className="text-3xl font-bold text-green-600">
                {batch.remainingQuantity}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      (batch.remainingQuantity / batch.quantity) * 100
                    }%`,
                  }}></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {Math.round((batch.remainingQuantity / batch.quantity) * 100)}%
                remaining
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Used Quantity</p>
              <p className="text-2xl font-bold text-orange-600">
                {batch.quantity - batch.remainingQuantity}
              </p>
              <p className="text-xs text-gray-600">
                {utilizationPercentage}% utilized
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {batch.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{batch.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
