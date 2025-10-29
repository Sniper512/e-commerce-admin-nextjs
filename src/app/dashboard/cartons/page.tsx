"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  Archive,
  Truck,
  Eye,
  Edit,
  Trash2,
  Filter,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import CartonService from "@/services/cartonService";
import { Carton } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function CartonsPage() {
  const [cartons, setCartons] = useState<Carton[]>([]);
  const [filteredCartons, setFilteredCartons] = useState<Carton[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived" | "shipped"
  >("all");
  const [stats, setStats] = useState({
    totalCartons: 0,
    activeCartons: 0,
    archivedCartons: 0,
    shippedCartons: 0,
    totalValue: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    loadCartons();
    loadStats();
  }, []);

  useEffect(() => {
    filterCartons();
  }, [cartons, searchTerm, statusFilter]);

  const loadCartons = async () => {
    try {
      setLoading(true);
      const data = await CartonService.getAllCartons();
      setCartons(data);
    } catch (error) {
      console.error("Error loading cartons:", error);
      alert("Failed to load cartons");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await CartonService.getCartonStats();
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const filterCartons = () => {
    let filtered = cartons;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((carton) => carton.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (carton) =>
          carton.name.toLowerCase().includes(lowercaseSearch) ||
          carton.cartonNumber.toLowerCase().includes(lowercaseSearch) ||
          carton.supplier?.toLowerCase().includes(lowercaseSearch) ||
          carton.products.some((p) =>
            p.productName.toLowerCase().includes(lowercaseSearch)
          )
      );
    }

    setFilteredCartons(filtered);
  };

  const handleDelete = async (id: string, cartonNumber: string) => {
    if (!confirm(`Are you sure you want to delete carton ${cartonNumber}?`)) {
      return;
    }

    try {
      await CartonService.deleteCarton(id);
      alert("Carton deleted successfully!");
      loadCartons();
      loadStats();
    } catch (error) {
      console.error("Error deleting carton:", error);
      alert("Failed to delete carton");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Active", className: "bg-green-100 text-green-800" },
      archived: { label: "Archived", className: "bg-gray-100 text-gray-800" },
      shipped: { label: "Shipped", className: "bg-blue-100 text-blue-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cartons Management</h1>
          <p className="text-gray-600">
            Manage inventory cartons with multiple products
          </p>
        </div>
        <Link href="/dashboard/cartons/add">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Carton
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cartons</p>
                <p className="text-2xl font-bold">{stats.totalCartons}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Cartons</p>
                <p className="text-2xl font-bold">{stats.activeCartons}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Archive className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, carton number, supplier, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cartons List ({filteredCartons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading cartons...</p>
            </div>
          ) : filteredCartons.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No cartons found</p>
              <Link href="/dashboard/cartons/add">
                <Button className="mt-4">Add Your First Carton</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Carton Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCartons.map((carton) => (
                    <tr key={carton.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {carton.cartonNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(carton.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">{carton.name}</div>
                        {carton.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {carton.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {carton.products.length} items
                        </div>
                        <div className="text-xs text-gray-500">
                          {carton.products
                            .slice(0, 2)
                            .map((p) => p.productName)
                            .join(", ")}
                          {carton.products.length > 2 && "..."}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {carton.totalQuantity}
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {formatCurrency(carton.totalCost)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(carton.status)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {carton.supplier || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/cartons/${carton.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/cartons/${carton.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDelete(carton.id, carton.cartonNumber)
                            }>
                            <Trash2 className="h-4 w-4 text-red-600" />
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
    </div>
  );
}
