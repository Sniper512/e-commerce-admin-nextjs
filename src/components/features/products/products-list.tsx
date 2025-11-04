"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, Eye, ArrowUpDown } from "lucide-react";
import type { Product, Category, SubCategory } from "@/types";
import { parseCategoryId } from "@/types";
import { productService } from "@/services/productService";
import Image from "next/image";

interface ProductsListProps {
  products: Product[];
  categories: any[]; // Categories with subcategories populated
}

export function ProductsList({ products, categories }: ProductsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to get category name from categoryId string
  const getCategoryName = (categoryIdString: string): string => {
    const parsed = parseCategoryId(categoryIdString);

    if (parsed.isSubCategory) {
      // Find parent category and subcategory
      const parentCategory = categories.find((c) => c.id === parsed.categoryId);
      if (parentCategory && parentCategory.subcategories) {
        const subCategory = parentCategory.subcategories.find(
          (sub: SubCategory) => sub.id === parsed.subCategoryId
        );
        if (subCategory) {
          return `${parentCategory.name} >> ${subCategory.name}`;
        }
      }
      return "Unknown Category";
    } else {
      // Main category
      const category = categories.find((c) => c.id === parsed.categoryId);
      return category ? category.name : "Uncategorized";
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await productService.delete(productId);
      alert("Product deleted successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) =>
    product.info.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-center">Image</TableHead>
                <TableHead className="text-center">Category</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500">
                    {searchQuery
                      ? "No products found matching your search"
                      : "No products yet. Create your first product!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  // Handle new categoryIds format
                  const categoryIdStrings = product.info.categoryIds || [];
                  const stock = product.inventory.stockQuantity;
                  const minStock = product.inventory.minimumStockQuantity;
                  const isLowStock = stock < minStock;
                  const productImage =
                    product.multimedia?.images?.[0]?.url ||
                    "/images/default-image.svg";

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.info.name}
                      </TableCell>
                      <TableCell>
                        <Image
                          src={productImage}
                          alt={product.info.name}
                          className="h-16 w-16 object-cover mx-auto"
                          width={64}
                          height={64}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {categoryIdStrings.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {categoryIdStrings.map((catIdString: string) => (
                              <Badge
                                key={catIdString}
                                variant="secondary"
                                className="text-xs">
                                {getCategoryName(catIdString)}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">Uncategorized</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-medium ${
                              isLowStock ? "text-red-600" : "text-green-600"
                            }`}>
                            {stock}
                          </span>
                          {isLowStock && (
                            <Badge variant="warning" className="mt-1">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            product.info.isPublished ? "success" : "secondary"
                          }>
                          {product.info.isPublished ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Link href={`/dashboard/products/${product.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="View details">
                              <Eye className="h-3 w-3" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            title="Delete product">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
