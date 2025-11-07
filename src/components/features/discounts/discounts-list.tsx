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
import { Search, Eye, Tag, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import discountService from "@/services/discountService";
import { Discount } from "@/types";
import Link from "next/link";

interface DiscountsListProps {
  discounts: Discount[];
}

export function DiscountsList({ discounts }: DiscountsListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleToggleStatus = async (id: string) => {
    try {
      await discountService.toggleStatus(id);
      router.refresh(); // Refresh server component data
    } catch (error) {
      console.error("Error toggling discount status:", error);
      alert("Failed to update discount status");
    }
  };

  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch =
      discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (discount.description &&
        discount.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && discount.isActive) ||
      (filterStatus === "inactive" && !discount.isActive);
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: discounts.length,
    active: discounts.filter((d) => d.isActive).length,
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
              <CheckCircle2 className="h-8 w-8 text-green-600" />
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
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Applies To</TableHead>
                <TableHead className="text-center">Value</TableHead>
                <TableHead className="text-center">Period</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500">
                    {searchTerm || filterStatus !== "all"
                      ? "No discounts found matching your filters"
                      : "No discounts yet. Create your first discount!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDiscounts.map((discount) => (
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
                          discount.type === "percentage" ? "default" : "success"
                        }>
                        {discount.type === "percentage" ? (
                          <div className="space-x-1">
                            <span className="font-mono">%</span>
                            <span> Percentage</span>
                          </div>
                        ) : (
                          <div className="space-x-1">
                            <span className="font-mono">PKR</span>
                            <span> Fixed</span>
                          </div>
                        )}
                      </Badge>
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
                        {discount.type === "percentage"
                          ? `${discount.value.toFixed(
                              discount.value % 1 === 0 ? 0 : 2
                            )}%`
                          : `PKR ${Math.floor(discount.value)}`}
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
                        variant={discount.isActive ? "success" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleToggleStatus(discount.id)}
                        title="Click to toggle status">
                        {discount.isActive ? "Active" : "Inactive"}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
