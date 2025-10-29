"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ProductSearchDropdown } from "@/components/features/products/product-search-dropdown";
import { Trash2 } from "lucide-react";
import { useState } from "react";

// Simplified product type for dropdown
interface SimpleProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  image: string;
}

// Similar product type
interface SimilarProduct {
  productId: string;
  productName: string;
  price: number;
  imageUrl?: string;
}

interface ProductSimilarTabProps {
  similarProducts: SimilarProduct[];
  onSimilarProductsChange: (value: SimilarProduct[]) => void;
  availableProducts: SimpleProduct[];
  defaultImage: string;
}

export function ProductSimilarTab({
  similarProducts,
  onSimilarProductsChange,
  availableProducts,
  defaultImage,
}: ProductSimilarTabProps) {
  const [searchValue, setSearchValue] = useState("");

  const addRelatedProduct = (productId: string) => {
    if (similarProducts.some((p) => p.productId === productId)) {
      return; // Already added
    }

    const product = availableProducts.find((p) => p.id === productId);
    if (product) {
      onSimilarProductsChange([
        ...similarProducts,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          imageUrl: product.image,
        },
      ]);
    }
    setSearchValue("");
  };

  const removeRelatedProduct = (productId: string) => {
    onSimilarProductsChange(
      similarProducts.filter((p) => p.productId !== productId)
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
              availableProducts={availableProducts}
              selectedProductId=""
              onSelect={addRelatedProduct}
              placeholder="Search for a product to add..."
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              defaultProductImage={defaultImage}
            />
          </div>

          {similarProducts.length > 0 ? (
            <div className="space-y-3">
              {similarProducts.map((product) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <img
                    src={product.imageUrl || defaultImage}
                    alt={product.productName}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImage;
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{product.productName}</h4>
                    <p className="text-sm text-gray-600">${product.price}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRelatedProduct(product.productId)}>
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
