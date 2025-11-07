"use client";

import { useState, useMemo } from "react";
import { Batch } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Package,
  MapPin,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface BatchTableProps {
  batches: Batch[];
  productId?: string;
}

type FilterType = "all" | "active" | "expired" | "expiring-soon";

export function BatchTable({ batches, productId }: BatchTableProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<"expiry" | "manufacturing">("expiry");

  // Helper function to get expiry status
  const getExpiryStatus = (expiryDate: Date) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        label: "Expired",
        color: "red",
        days: Math.abs(daysUntilExpiry),
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring-soon",
        label: "Expiring Soon",
        color: "yellow",
        days: daysUntilExpiry,
      };
    } else {
      return {
        status: "active",
        label: "Active",
        color: "green",
        days: daysUntilExpiry,
      };
    }
  };

  // Filter and sort batches
  const filteredAndSortedBatches = useMemo(() => {
    let filtered = [...batches];
    const now = new Date();

    // Apply filter
    if (filter === "active") {
      // Not expired yet
      filtered = filtered.filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate >= now;
      });
    } else if (filter === "expired") {
      // Past expiry date
      filtered = filtered.filter((batch) => {
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate < now;
      });
    } else if (filter === "expiring-soon") {
      filtered = filtered.filter((batch) => {
        const expiryStatus = getExpiryStatus(batch.expiryDate);
        const expiryDate = new Date(batch.expiryDate);
        return expiryStatus.status === "expiring-soon" && expiryDate >= now;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      if (sortBy === "expiry") {
        return (
          new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
      } else {
        return (
          new Date(b.manufacturingDate).getTime() -
          new Date(a.manufacturingDate).getTime()
        );
      }
    });

    return filtered;
  }, [batches, filter, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const total = batches.length;
    const active = batches.filter((b) => {
      const expiryDate = new Date(b.expiryDate);
      return expiryDate >= now;
    }).length;
    const expired = batches.filter((b) => {
      const expiryDate = new Date(b.expiryDate);
      return expiryDate < now;
    }).length;
    const expiringSoon = batches.filter((b) => {
      const expiryStatus = getExpiryStatus(b.expiryDate);
      const expiryDate = new Date(b.expiryDate);
      return expiryStatus.status === "expiring-soon" && expiryDate >= now;
    }).length;

    return { total, active, expired, expiringSoon };
  }, [batches]);

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          No Batches Available
        </h3>
        <p className="text-gray-500 mb-4">
          This product doesn't have any batches yet.
        </p>
        {productId && (
          <Link href={`/dashboard/batches/add?productId=${productId}`}>
            <Button>Add First Batch</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filter === "all" ? "default" : "secondary"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setFilter("all")}>
            All ({stats.total})
          </Badge>
          <Badge
            variant={filter === "active" ? "success" : "secondary"}
            className="cursor-pointer px-3 py-1"
            onClick={() => setFilter("active")}>
            <CheckCircle className="h-3 w-3 mr-1" />
            Active ({stats.active})
          </Badge>
          {stats.expiringSoon > 0 && (
            <Badge
              variant={filter === "expiring-soon" ? "warning" : "secondary"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setFilter("expiring-soon")}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expiring Soon ({stats.expiringSoon})
            </Badge>
          )}
          {stats.expired > 0 && (
            <Badge
              variant={filter === "expired" ? "danger" : "secondary"}
              className="cursor-pointer px-3 py-1"
              onClick={() => setFilter("expired")}>
              <XCircle className="h-3 w-3 mr-1" />
              Expired ({stats.expired})
            </Badge>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            className="text-sm border rounded-md px-2 py-1"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "expiry" | "manufacturing")
            }>
            <option value="expiry">Expiry Date (FEFO)</option>
            <option value="manufacturing">Manufacturing Date</option>
          </select>
        </div>
      </div>

      {/* Warning Banner for Expiring Batches */}
      {stats.expiringSoon > 0 && filter !== "expiring-soon" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">
                {stats.expiringSoon}{" "}
                {stats.expiringSoon === 1 ? "batch" : "batches"} expiring within
                30 days
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Review and prioritize these batches for sale.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Batches Table */}
      <div className="rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Manufacturing</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedBatches.map((batch) => {
              const expiryStatus = getExpiryStatus(batch.expiryDate);

              return (
                <TableRow key={batch.id}>
                  <TableCell>
                    <span className="font-semibold">{batch.batchId}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">
                        {batch.remainingQuantity.toLocaleString()} /{" "}
                        {batch.quantity.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round(
                          (batch.remainingQuantity / batch.quantity) * 100
                        )}
                        % remaining
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-700">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      {formatDate(batch.manufacturingDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {formatDate(batch.expiryDate)}
                      </div>
                      <span
                        className={`text-xs mt-1 ${
                          expiryStatus.status === "expired"
                            ? "text-red-600"
                            : expiryStatus.status === "expiring-soon"
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}>
                        {expiryStatus.status === "expired"
                          ? `Expired ${expiryStatus.days} days ago`
                          : expiryStatus.status === "expiring-soon"
                          ? `${expiryStatus.days} days left`
                          : `${expiryStatus.days} days left`}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm font-semibold text-gray-900">
                      {batch.price}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        expiryStatus.status === "expired"
                          ? "danger"
                          : expiryStatus.status === "expiring-soon"
                          ? "warning"
                          : "success"
                      }>
                      {expiryStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/batches/${batch.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedBatches.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No batches found for this filter.
        </div>
      )}
    </div>
  );
}
