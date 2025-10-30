"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Package } from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import type { Product, Category } from "@/types";
import { ProductsSearchFilter } from "./products-search-filter";

const DEFAULT_PRODUCT_IMAGE = "/images/default-product.svg";

interface ProductsGridProps {
  initialProducts: Product[];
  categories: Category[];
}

export function ProductsGrid({
  initialProducts,
  categories,
}: ProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Helper function to get category name from ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const filteredProducts = products.filter((product) =>
    product.info.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await productService.delete(productId);
        // Update local state to remove deleted product
        setProducts(products.filter((p) => p.id !== productId));
      } catch (err) {
        alert("Failed to delete product");
      }
    }
  };

  return (
    <>
      {/* Search Filter */}
      <ProductsSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Get started by adding your first product"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const primaryImage =
              product.multimedia.images.find((img) => img.isPrimary)?.url ||
              product.multimedia.images[0]?.url;
            const categoryId = product.info.categories[0];
            const categoryName = categoryId
              ? getCategoryName(categoryId)
              : "Uncategorized";
            const stock = product.inventory.stockQuantity;
            const minStock = product.inventory.minimumStockQuantity;
            const isLowStock = stock < minStock;

            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <img
                    src={primaryImage || DEFAULT_PRODUCT_IMAGE}
                    alt={product.info.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold line-clamp-1">
                          {product.info.name}
                        </h3>
                      </div>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">{categoryName}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Stock:</span>
                      <span
                        className={`font-medium ${
                          isLowStock ? "text-red-600" : "text-green-600"
                        }`}>
                        {stock} units
                      </span>
                    </div>

                    {isLowStock && (
                      <Badge
                        variant="warning"
                        className="w-full justify-center">
                        Low Stock Alert
                      </Badge>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
