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
import type { Product, Category } from "@/types";
import { productService } from "@/services/productService";
import Image from "next/image";

interface ProductsListProps {
  products: Product[];
  categories: Category[];
}

export function ProductsList({ products, categories }: ProductsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Helper function to get category name from ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
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
                <TableHead>
                  <button className="flex items-center gap-1 font-semibold">
                    Product Name
                    <ArrowUpDown className="h-4 w-4" />
                  </button>
                </TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  const categoryId = product.info.categories[0];
                  const categoryName = categoryId
                    ? getCategoryName(categoryId)
                    : "Uncategorized";
                  const stock = product.inventory.stockQuantity;
                  const minStock = product.inventory.minimumStockQuantity;
                  const isLowStock = stock < minStock;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.info.name}
                      </TableCell>
                      <TableCell>
                        <Image
                          src={
                            product.images && product.images[0]
                              ? product.images[0]
                              : "/images/default-product.svg"
                          }
                          alt={product.info.name}
                          className="h-16 w-16 object-cover"
                          width={64}
                          height={64}
                        />
                      </TableCell>
                      <TableCell>{categoryName}</TableCell>
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
                          variant={product.isActive ? "success" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
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
