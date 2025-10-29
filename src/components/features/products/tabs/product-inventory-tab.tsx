"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductInventoryTabProps {
  stockQuantity: number;
  minimumStockQuantity: number;
  onMinimumStockQuantityChange: (value: number) => void;
}

export function ProductInventoryTab({
  stockQuantity,
  minimumStockQuantity,
  onMinimumStockQuantityChange,
}: ProductInventoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="form-group">
            <Label htmlFor="stockQty" className="form-label">
              Stock Quantity
            </Label>
            <Input
              id="stockQty"
              type="number"
              placeholder="0"
              value={stockQuantity}
              disabled
            />
          </div>

          <div className="form-group">
            <Label htmlFor="minStock" className="form-label">
              Minimum Stock Quantity
            </Label>
            <Input
              id="minStock"
              type="number"
              placeholder="5"
              value={minimumStockQuantity}
              onChange={(e) =>
                onMinimumStockQuantityChange(Number(e.target.value))
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
