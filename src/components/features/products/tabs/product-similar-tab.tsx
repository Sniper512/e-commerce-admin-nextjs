"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Product } from "@/types";

interface ProductSimilarTabProps {
  similarProductIds: string[];
  onSimilarProductIdsChange: (value: string[]) => void;
  availableProducts: Product[];
  defaultImage: string;
}

export function ProductSimilarTab({
  similarProductIds,
  onSimilarProductIdsChange,
  availableProducts,
  defaultImage,
}: ProductSimilarTabProps) {
  const [searchValue, setSearchValue] = useState("");

  // Convert products to the format expected by ProductSearchDropdown
  // Filter out already selected products
  const availableProductsForDropdown = availableProducts
    .filter((product) => !similarProductIds.includes(product.id))
    .map((product) => ({
      id: product.id,
      name: product.info.name,
      image: product.multimedia.images[0] || "/images/default-image.svg",
    }));

  const addSimilarProduct = (productId: string) => {
    if (similarProductIds?.includes(productId)) {
      return; // Already added
    }

    const product = availableProducts.find((p) => p.id === productId);
    if (product) {
      onSimilarProductIdsChange([...(similarProductIds || []), product.id]);
    }
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
              {similarProductIds.map((productId) => (
                <div
                  key={productId}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  {/* <Image
                    src={product.imageUrl || defaultImage}
                    alt={product.productName}
                    className="w-16 h-16 object-cover rounded"
                    width={64}
                    height={64}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImage;
                    }}
                  /> */}
                  <div className="flex-1">
                    <h4 className="font-medium">{productId}</h4>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSimilarProduct(productId)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
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
