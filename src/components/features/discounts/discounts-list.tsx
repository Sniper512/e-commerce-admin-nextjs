"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  Calendar,
  Percent,
  DollarSign,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import discountService from "@/services/discountService";
import { Discount } from "@/types";
import Link from "next/link";

interface DiscountsListProps {
  discounts: Discount[];
}

export function DiscountsList({ discounts }: DiscountsListProps) {
  console.log("DiscountsList discounts:", discounts);

  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Helper function to format date strings
  const formatDate = (date: Date | string) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this discount?")) {
      return;
    }

    try {
      await discountService.delete(id);
      alert("Discount deleted successfully!");
      router.refresh(); // Refresh server component data
    } catch (error) {
      console.error("Error deleting discount:", error);
      alert("Failed to delete discount");
    }
  };

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
              <Percent className="h-8 w-8 text-blue-600" />
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
              <Calendar className="h-8 w-8 text-green-600" />
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
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search discounts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Discounts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDiscounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {searchTerm || filterStatus !== "all"
                  ? "No discounts found matching your filters"
                  : "No discounts found"}
              </p>
              {discounts.length === 0 && (
                <Button
                  onClick={() => router.push("/dashboard/discounts/add")}
                  className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Discount
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="table-header">Name</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Applies To</th>
                    <th className="table-header">Value</th>
                    <th className="table-header">Limitation</th>
                    <th className="table-header">Period</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="border-b">
                      <td className="table-cell">
                        <div>
                          <p className="font-medium">{discount.name}</p>
                          <p className="text-sm text-gray-600">
                            {discount.description || "No description"}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            discount.type === "percentage"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                          {discount.type === "percentage" ? (
                            <>
                              <Percent className="h-3 w-3 mr-1" />
                              Percentage
                            </>
                          ) : (
                            <>
                              <DollarSign className="h-3 w-3 mr-1" />
                              Fixed Amount
                            </>
                          )}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            discount.applicableTo === "order"
                              ? "bg-purple-100 text-purple-800"
                              : discount.applicableTo === "products"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-teal-100 text-teal-800"
                          }`}>
                          {discount.applicableTo === "order" && "Total Order"}
                          {discount.applicableTo === "products" &&
                            "Specific Products"}
                          {discount.applicableTo === "categories" &&
                            "Categories"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">
                          {discount.type === "percentage"
                            ? `${discount.value}%`
                            : formatCurrency(discount.value)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          {discount.limitationType === "unlimited" ? (
                            <span className="text-green-600 font-medium">
                              Unlimited
                            </span>
                          ) : discount.limitationType === "n_times_only" ? (
                            <>
                              <p className="font-medium">
                                {discount.currentUsageCount || 0} /{" "}
                                {discount.limitationTimes}
                              </p>
                              <p className="text-gray-600 text-xs">
                                Total uses
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium">
                                {discount.limitationTimes} per customer
                              </p>
                              <p className="text-gray-600 text-xs">Max uses</p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="text-sm">
                          <p>{formatDate(discount.startDate)}</p>
                          <p className="text-gray-600">
                            to {formatDate(discount.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium cursor-pointer ${
                            discount.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                          onClick={() => handleToggleStatus(discount.id)}
                          title="Click to toggle status">
                          {discount.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
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
                            onClick={() => handleDelete(discount.id)}
                            title="Delete discount">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
