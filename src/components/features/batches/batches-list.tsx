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
import {
  Search,
  Trash2,
  Eye,
  Calendar,
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import batchService from "@/services/batchService";
import type { Batch } from "@/types";
import Link from "next/link";
import Image from "next/image";

interface EnrichedBatch extends Batch {
  productName?: string;
  productImage?: string;
}

interface BatchesListProps {
  batches: EnrichedBatch[];
}

export function BatchesList({ batches }: BatchesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this batch?")) {
      return;
    }

    try {
      await batchService.deleteBatch(id);
      alert("Batch deleted successfully!");
      router.refresh(); // Refresh server component data
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch");
    }
  };

  const isExpiringSoon = (batch: Batch): boolean => {
    const now = new Date();
    const expiryDate = new Date(batch.expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return (
      daysUntilExpiry <= 30 && daysUntilExpiry > 0 && batch.status === "active"
    );
  };

  const isExpired = (batch: Batch): boolean => {
    const now = new Date();
    const expiryDate = new Date(batch.expiryDate);
    return expiryDate < now;
  };

  const getDaysUntilExpiry = (batch: Batch): number => {
    const now = new Date();
    const expiryDate = new Date(batch.expiryDate);
    return Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Filter batches based on search
  const filteredBatches = batches.filter((batch) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      batch.batchId.toLowerCase().includes(searchLower) ||
      batch.productName?.toLowerCase().includes(searchLower) ||
      batch.supplier?.toLowerCase().includes(searchLower)
    );
  });

  // Calculate stats based on filtered batches
  const stats = {
    total: filteredBatches.length,
    active: filteredBatches.filter((b) => b.status === "active").length,
    expiring: filteredBatches.filter(isExpiringSoon).length,
    expired: filteredBatches.filter(
      (b) => b.status === "expired" || isExpired(b)
    ).length,
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Batches
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Batches
                </p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Expiring Soon
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.expiring}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.expired}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search by batch ID, product, or supplier..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead className="text-center">Product</TableHead>
                <TableHead className="text-center">Quantity</TableHead>
                <TableHead className="text-center">
                  Manufacturing Date
                </TableHead>
                <TableHead className="text-center">Expiry Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? "No batches found matching your search"
                      : "No batches yet. Create your first batch!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch) => {
                  const daysUntilExpiry = getDaysUntilExpiry(batch);
                  const expired = isExpired(batch);
                  const expiringSoon = isExpiringSoon(batch);

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        <div>{batch.batchId}</div>
                        {batch.supplier && (
                          <div className="text-xs text-gray-500 mt-1">
                            Supplier: {batch.supplier}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 justify-center">
                          <Image
                            src={
                              batch.productImage || "/images/default-image.svg"
                            }
                            alt={batch.productName || "Product"}
                            width={48}
                            height={48}
                            className="object-cover rounded"
                          />
                          <div className="text-left">
                            <div className="font-medium">
                              {batch.productName || "N/A"}
                            </div>
                            {batch.location && (
                              <div className="text-xs text-gray-500 mt-1">
                                Location: {batch.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div>
                          <span className="font-medium">
                            {batch.remainingQuantity}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            / {batch.quantity}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(
                            (batch.remainingQuantity / batch.quantity) * 100
                          )}
                          % remaining
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(
                            batch.manufacturingDate
                          ).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </div>
                        {!expired && daysUntilExpiry <= 30 && (
                          <div className="text-xs text-orange-600 font-medium mt-1">
                            Expires in {daysUntilExpiry} days
                          </div>
                        )}
                        {expired && (
                          <div className="text-xs text-red-600 font-medium mt-1">
                            Expired {Math.abs(daysUntilExpiry)} days ago
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            batch.status === "active" &&
                            !expired &&
                            !expiringSoon
                              ? "success"
                              : batch.status === "active" && expiringSoon
                              ? "warning"
                              : "secondary"
                          }>
                          {expired || batch.status === "expired"
                            ? "Expired"
                            : expiringSoon
                            ? "Expiring Soon"
                            : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Link href={`/dashboard/batches/${batch.id}`}>
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
                            onClick={() => handleDelete(batch.id)}
                            title="Delete batch">
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
