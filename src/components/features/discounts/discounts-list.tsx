"use client";

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
import { Search, Eye, Tag, XCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import discountService from "@/services/discountService";
import { productService } from "@/services/productService";
import { Discount } from "@/types";
import { useToast } from "@/components/ui/toast-context";
import Link from "next/link";

interface FeaturedItem {
  discount: Discount;
  product: {
    id: string;
    name: string;
    image: string;
  };
}

interface DiscountsListProps {
  discounts: Discount[];
  featuredItems?: FeaturedItem[];
}

export function DiscountsList({ discounts, featuredItems = [] }: DiscountsListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Calculate stats
  const stats = {
    total: discounts.length,
    active: discounts.filter(
      (d) => discountService.isDiscountActive(d)
    ).length,
  };

  const handleToggleActive = async (discountId: string) => {
    try {
      await discountService.toggleActiveStatus(discountId);
      showToast("success", "Discount status updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error toggling discount status:", error);
      showToast("error", "Failed to update discount status", error instanceof Error ? error.message : "Unknown error");
    }
  };

  const handleToggleFeatured = async (productId: string, discountId: string) => {
    try {
      await productService.toggleFeaturedDiscount(productId, discountId);
      showToast("success", "Featured status updated successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      showToast("error", "Failed to update featured status", error instanceof Error ? error.message : "Unknown error");
    }
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Discounts
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Discounts
                </p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{stats.active}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Discounts
                </p>
                <p className="text-2xl font-bold">
                  {stats.total - stats.active}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Applies To</TableHead>
                <TableHead className="text-center">Value</TableHead>
                <TableHead className="text-center">Period</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500">
                    {searchTerm || filterStatus !== "all"
                      ? "No discounts found matching your filters"
                      : "No discounts yet. Create your first discount!"}
                  </TableCell>
                </TableRow>
              ) : (
                discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{discount.name}</p>
                        {discount.description && (
                          <p className="text-sm text-gray-600">
                            {discount.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          discount.applicableTo === "order"
                            ? "secondary"
                            : discount.applicableTo === "products"
                            ? "default"
                            : "success"
                        }>
                        {discount.applicableTo === "order" && "Total Order"}
                        {discount.applicableTo === "products" && "Products"}
                        {discount.applicableTo === "categories" && "Categories"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {discount.value.toFixed(
                          discount.value % 1 === 0 ? 0 : 2
                        )}
                        %
                      </span>
                      {discount.applicableTo === "order" &&
                        discount.minPurchaseAmount &&
                        discount.minPurchaseAmount > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Min: PKR {Math.floor(discount.minPurchaseAmount)}
                          </p>
                        )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <p>{formatDate(discount.startDate)}</p>
                        <p className="text-gray-600 text-xs">
                          to {formatDate(discount.endDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          discountService.isDiscountActive(discount)
                            ? "success"
                            : "secondary"
                        }
                        className="cursor-pointer"
                        title="Click to toggle status">
                        {discountService.isDiscountActive(discount)
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Link href={`/dashboard/discounts/${discount.id}`}>
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
                          onClick={() => handleToggleActive(discount.id)}
                          title={discount.isActive ? "Disable Discount" : "Enable Discount"}>
                          {discount.isActive ? (
                            <ToggleRight className="h-3 w-3" />
                          ) : (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Featured Products Table */}
      {featuredItems.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Featured Products</h3>
              <p className="text-sm text-gray-600">Products with discounts featured on the homepage</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className="text-center">Value</TableHead>
                  <TableHead className="text-center">Period</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featuredItems.map((item, index) => (
                  <TableRow key={`${item.discount.id}-${item.product.id}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                            (e.target as HTMLImageElement).src = "/images/default-image.svg";
                          }}
                        />
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-sm text-gray-600">ID: {item.product.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.discount.name}</p>
                        {item.discount.description && (
                          <p className="text-sm text-gray-600">
                            {item.discount.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">
                        {item.discount.value.toFixed(
                          item.discount.value % 1 === 0 ? 0 : 2
                        )}
                        %
                      </span>
                      {item.discount.applicableTo === "order" &&
                        item.discount.minPurchaseAmount &&
                        item.discount.minPurchaseAmount > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Min: PKR {Math.floor(item.discount.minPurchaseAmount)}
                          </p>
                        )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="text-sm">
                        <p>{formatDate(item.discount.startDate)}</p>
                        <p className="text-gray-600 text-xs">
                          to {formatDate(item.discount.endDate)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          discountService.isDiscountActive(item.discount)
                            ? "success"
                            : "secondary"
                        }>
                        {discountService.isDiscountActive(item.discount)
                          ? "Active"
                          : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Link href={`/dashboard/discounts/${item.discount.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            title="View discount details">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleFeatured(item.product.id, item.discount.id)}
                          title="Remove from featured">
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
