"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, Eye } from "lucide-react";
import type { Manufacturer } from "@/types";
import manufacturerService from "@/services/manufacturerService";
import { LinkButton } from "@/components/ui/link-button";
import Image from "next/image";

const DEFAULT_LOGO = "/images/default-manufacturer.svg";

interface ManufacturersListProps {
  manufacturers: Manufacturer[];
}

export function ManufacturersList({ manufacturers }: ManufacturersListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter manufacturers based on search
  const filteredManufacturers = useMemo(() => {
    if (!searchQuery) return manufacturers;

    const query = searchQuery.toLowerCase();
    return manufacturers.filter((manufacturer) => {
      const name = manufacturer.name.toLowerCase();
      const description = (manufacturer.description || "").toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [manufacturers, searchQuery]);

  const handleDelete = async (
    manufacturerId: string,
    manufacturerName: string
  ) => {
    if (!confirm(`Are you sure you want to delete "${manufacturerName}"?`)) {
      return;
    }

    try {
      await manufacturerService.deleteManufacturer(manufacturerId);
      alert("Manufacturer deleted successfully!");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error deleting manufacturer"
      );
    }
  };

  return (
    <>
      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search manufacturers..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manufacturers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Order</TableHead>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManufacturers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500">
                    No manufacturers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredManufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id}>
                    <TableCell className="font-medium">
                      {manufacturer.displayOrder}
                    </TableCell>
                    <TableCell>
                      <Image
                        src={manufacturer.logo || DEFAULT_LOGO}
                        alt={manufacturer.name}
                        className="w-12 h-12 object-contain rounded border"
                        width={48}
                        height={48}
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_LOGO;
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-semibold">
                      {manufacturer.name}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm text-gray-600">
                        {manufacturer.description || "No description"}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {manufacturer.productCount || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <LinkButton
                          variant="outline"
                          size="sm"
                          href={`/dashboard/manufacturers/${manufacturer.id}`}>
                          <Eye className="h-3 w-3" />
                        </LinkButton>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleDelete(manufacturer.id, manufacturer.name)
                          }>
                          <Trash2 className="h-3 w-3" />
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
    </>
  );
}
