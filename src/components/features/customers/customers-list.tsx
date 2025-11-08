"use client";

import React, { useState } from "react";
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
import { Search, Eye, Users, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import customerService from "@/services/customerService";
import type { Customer } from "@/types";

interface CustomersListProps {
  customers: Customer[];
}

export function CustomersList({ customers }: CustomersListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleActive = async (id: string) => {
    try {
      await customerService.toggleActiveStatus(id);
      router.refresh();
    } catch (error) {
      console.error("Error toggling customer status:", error);
      alert("Failed to update customer status");
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isActive).length;
  const inactiveCustomers = totalCustomers - activeCustomers;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Customers</p>
                <p className="text-2xl font-bold">{inactiveCustomers}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search customers by name, phone, or address..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-center">Total Spent</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-gray-500">
                    {searchQuery
                      ? "No customers found matching your search"
                      : "No customers yet. Add your first customer!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                    </TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600">
                        {customer.address || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {customer.totalOrders}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {formatCurrency(customer.totalSpent)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge
                          variant={customer.isActive ? "success" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(customer.id)}>
                          {customer.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {customer.notificationsEnabled && (
                          <Badge variant="default" className="text-xs">
                            🔔 Notifications
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="View Customer"
                          onClick={() =>
                            router.push(`/dashboard/customers/${customer.id}`)
                          }>
                          <Eye className="h-3 w-3" />
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

      {filteredCustomers.length === 0 && searchQuery && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-gray-600">Try adjusting your search</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
