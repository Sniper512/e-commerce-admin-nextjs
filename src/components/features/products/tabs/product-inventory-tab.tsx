"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BatchTable } from "@/components/features/batches/batch-table";
import { Batch } from "@/types";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";

interface ProductInventoryTabProps {
  minimumStockQuantity: number;
  onMinimumStockQuantityChange: (value: number | "") => void;
  batches?: Batch[];
  productId?: string;
}

export function ProductInventoryTab({
  minimumStockQuantity,
  onMinimumStockQuantityChange,
  batches = [],
  productId,
}: ProductInventoryTabProps) {
  // Calculate total stock from all batches
  const calculatedStockQuantity = useMemo(() => {
    return batches.reduce((total, batch) => total + batch.remainingQuantity, 0);
  }, [batches]);

  // Calculate expired stock (batches that have passed their expiry date)
  const expiredStockQuantity = useMemo(() => {
    const now = new Date();
    return batches
      .filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate < now; // Past expiry date
      })
      .reduce((total, batch) => total + batch.remainingQuantity, 0);
  }, [batches]);

  // Calculate usable stock (batches that haven't expired yet)
  const usableStockQuantity = useMemo(() => {
    const now = new Date();
    return batches
      .filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate >= now; // Not expired yet
      })
      .reduce((total, batch) => total + batch.remainingQuantity, 0);
  }, [batches]);

  // Determine stock status
  const stockStatus = useMemo(() => {
    const totalStock = usableStockQuantity;

    if (totalStock === 0) {
      return {
        label: "Out of Stock",
        color: "danger" as const,
        icon: AlertTriangle,
      };
    } else if (totalStock <= minimumStockQuantity) {
      return {
        label: "Low Stock",
        color: "warning" as const,
        icon: AlertTriangle,
      };
    } else {
      return {
        label: "In Stock",
        color: "success" as const,
        icon: CheckCircle,
      };
    }
  }, [usableStockQuantity, minimumStockQuantity]);

  // Count of total batches
  const totalBatchCount = batches.length;

  // Check if this is add mode (no productId means new product)
  const isAddMode = !productId;

  return (
    <div className="space-y-6">
      {/* Show Stock Summary only in edit mode when batches exist */}
      {!isAddMode && batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="usableStock" className="form-label">
                Usable Stock (Not Expired)
              </Label>
              <div className="relative">
                <Input
                  id="usableStock"
                  type="number"
                  placeholder="0"
                  value={usableStockQuantity}
                  disabled
                  className="pr-20 font-semibold text-green-700"
                />
                <Badge
                  variant={stockStatus.color}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <stockStatus.icon className="h-3 w-3 mr-1" />
                  {stockStatus.label}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Package className="h-3 w-3" />
                From active non-expired batches
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiredStock" className="form-label">
                Expired Stock
              </Label>
              <Input
                id="expiredStock"
                type="number"
                placeholder="0"
                value={expiredStockQuantity}
                disabled
                className="font-semibold text-red-700"
              />
              {expiredStockQuantity > 0 && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Requires disposal or return
                </p>
              )}
              {expiredStockQuantity === 0 && (
                <p className="text-xs text-gray-500">No expired stock</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalStock" className="form-label">
                Total Stock (All Batches)
              </Label>
              <Input
                id="totalStock"
                type="number"
                placeholder="0"
                value={calculatedStockQuantity}
                disabled
                className="font-semibold"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Package className="h-3 w-3" />
                From {totalBatchCount}{" "}
                {totalBatchCount === 1 ? "batch" : "batches"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stock Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAddMode ? "Inventory Settings" : "Stock Settings"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minStock" className="form-label">
              Minimum Stock Quantity
            </Label>
            <Input
              id="minStock"
              type="number"
              placeholder="5"
              value={minimumStockQuantity}
              onChange={(e) =>
                onMinimumStockQuantityChange(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
            />
            <p className="text-xs text-gray-500">
              Alert when stock falls below this level
            </p>
          </div>

          {/* Show Stock Health only in edit mode when batches exist */}
          {!isAddMode && batches.length > 0 && (
            <div className="space-y-2">
              <Label className="form-label">Stock Health</Label>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available:</span>
                  <span className="font-semibold">
                    {usableStockQuantity.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Minimum:</span>
                  <span className="font-semibold">
                    {minimumStockQuantity.toLocaleString()} units
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Buffer:</span>
                  <span
                    className={`font-semibold ${
                      usableStockQuantity - minimumStockQuantity < 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}>
                    {(
                      usableStockQuantity - minimumStockQuantity
                    ).toLocaleString()}{" "}
                    units
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Show helpful message in add mode */}
          {isAddMode && (
            <div className="space-y-2">
              <Label className="form-label">Stock Information</Label>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Stock will be managed through batches
                  after the product is created. You can add batches from the
                  Batches section.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show Batch Details only in edit mode */}
      {!isAddMode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Batch Details</CardTitle>
              <Badge variant="secondary">
                {batches.length} {batches.length === 1 ? "Batch" : "Batches"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {batches.length > 0 ? (
              <BatchTable batches={batches} productId={productId} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No batches added yet</p>
                <p className="text-sm mt-1">
                  Add batches to track inventory for this product
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
