"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Calendar,
  Truck,
  FileText,
  DollarSign,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CartonService from "@/services/cartonService";
import { Carton } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function CartonDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [carton, setCarton] = useState<Carton | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCarton();
  }, [params.id]);

  const loadCarton = async () => {
    try {
      setLoading(true);
      const data = await CartonService.getCartonById(params.id);
      if (data) {
        setCarton(data);
      } else {
        alert("Carton not found");
        router.push("/dashboard/cartons");
      }
    } catch (error) {
      console.error("Error loading carton:", error);
      alert("Failed to load carton");
      router.push("/dashboard/cartons");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!carton) return;

    if (
      !confirm(
        `Are you sure you want to delete carton ${carton.cartonNumber}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await CartonService.deleteCarton(carton.id);
      alert("Carton deleted successfully!");
      router.push("/dashboard/cartons");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading carton details...</p>
        </div>
      </div>
    );
  }

  if (!carton) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/cartons">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{carton.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600">{carton.cartonNumber}</span>
              {getStatusBadge(carton.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/cartons/${carton.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{carton.products.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quantity</p>
                <p className="text-2xl font-bold">{carton.totalQuantity}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(carton.totalCost)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carton Details */}
      <Card>
        <CardHeader>
          <CardTitle>Carton Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {carton.description && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Description</p>
              <p className="text-gray-900">{carton.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {carton.supplier && (
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Supplier</p>
                  <p className="font-medium">{carton.supplier}</p>
                </div>
              </div>
            )}

            {carton.purchaseDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Purchase Date</p>
                  <p className="font-medium">
                    {new Date(carton.purchaseDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-medium">
                  {new Date(carton.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">
                  {new Date(carton.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {carton.notes && (
            <div className="flex items-start gap-3 pt-4 border-t">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">Notes</p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {carton.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products List */}
      <Card>
        <CardHeader>
          <CardTitle>Products in Carton</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Cost/Unit
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {carton.products.map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {product.productName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatCurrency(product.costPerUnit)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      {formatCurrency(product.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-semibold">
                <tr>
                  <td className="px-6 py-4" colSpan={2}>
                    Total
                  </td>
                  <td className="px-6 py-4 text-right">
                    {carton.totalQuantity}
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4 text-right text-blue-600">
                    {formatCurrency(carton.totalCost)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
