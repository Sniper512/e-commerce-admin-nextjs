"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface ProductSimilarTabProps {
  similarProductIds: string[];
  onSimilarProductIdsChange: (value: string[]) => void;
  availableProducts: Array<{ id: string; name: string; image: string }>;
  selectedProducts: Array<{ id: string; name: string; image: string }>; // Already selected similar products with populated data
  defaultImage: string;
}

export function ProductSimilarTab({
  similarProductIds,
  onSimilarProductIdsChange,
  availableProducts,
  selectedProducts,
  defaultImage,
}: ProductSimilarTabProps) {
  const [searchValue, setSearchValue] = useState("");

  // Filter out already selected products from available list
  const availableProductsForDropdown = availableProducts.filter(
    (product) => !similarProductIds.includes(product.id)
  );

  const addSimilarProduct = (productId: string) => {
    if (similarProductIds?.includes(productId)) {
      return; // Already added
    }
    onSimilarProductIdsChange([...(similarProductIds || []), productId]);
    setSearchValue("");
  };

  const removeSimilarProduct = (productId: string) => {
    onSimilarProductIdsChange(
      (similarProductIds || []).filter((p) => p !== productId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Products</CardTitle>
        <p className="text-sm text-gray-600">
          Similar products are displayed on the product details page to help
          customers discover alternative or complementary options.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="form-label">Search and Add Product</Label>
            <ProductSearchDropdown
              availableProducts={availableProductsForDropdown}
              selectedProductId=""
              onSelect={addSimilarProduct}
              placeholder="Search for a product to add..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              defaultProductImage={defaultImage}
            />
          </div>

          {similarProductIds && similarProductIds.length > 0 ? (
            <div className="space-y-3">
              {similarProductIds.map((productId) => {
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
                      className="w-12 h-12 object-cover rounded"
                      width={48}
                      height={48}
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
                      onClick={() => removeSimilarProduct(productId)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              No similar products added yet
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
