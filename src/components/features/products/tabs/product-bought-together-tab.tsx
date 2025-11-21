"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ProductBoughtTogetherTabProps {
  boughtTogetherProductIds: string[];
  onBoughtTogetherProductIdsChange: (value: string[]) => void;
  availableProducts: Array<{ id: string; name: string; image: string }>;
  selectedProducts: Array<{ id: string; name: string; image: string }>; // Already selected bought-together products with populated data
  defaultImage: string;
}

export function ProductBoughtTogetherTab({
  boughtTogetherProductIds,
  onBoughtTogetherProductIdsChange,
  availableProducts,
  selectedProducts,
  defaultImage,
}: ProductBoughtTogetherTabProps) {
  const [searchValue, setSearchValue] = useState("");

  // Note: ProductSearchDropdown now uses API search instead of pre-filtered products

  const addBoughtTogetherProduct = (productId: string) => {
    if (boughtTogetherProductIds?.includes(productId)) {
      return; // Already added
    }
    onBoughtTogetherProductIdsChange([
      ...(boughtTogetherProductIds || []),
      productId,
    ]);
    setSearchValue("");
  };

  const removeBoughtTogetherProduct = (productId: string) => {
    onBoughtTogetherProductIdsChange(
      (boughtTogetherProductIds || []).filter((id) => id !== productId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bought Together Products</CardTitle>
        <p className="text-sm text-gray-600">
          Frequently bought together products are displayed at the bottom of the
          checkout page to encourage additional purchases that complement the
          selected product.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Search and Add Product</Label>
            <ProductSearchDropdown
              selectedProductId=""
              onSelect={addBoughtTogetherProduct}
              placeholder="Search for a product to add..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              defaultProductImage={defaultImage}
            />
          </div>

          {boughtTogetherProductIds && boughtTogetherProductIds.length > 0 ? (
            <div className="space-y-3">
              {boughtTogetherProductIds.map((productId) => {
                const product = availableProducts.find(
                  (p) => p.id === productId
                );
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <Image
                      src={product.image || defaultImage}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                      width={64}
                      height={64}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultImage;
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBoughtTogetherProduct(productId)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              No bought together products added yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
