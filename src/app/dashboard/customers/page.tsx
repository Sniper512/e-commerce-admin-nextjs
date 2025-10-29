"use client";

import React from "react";
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
import {
  Search,
  Eye,
  Edit,
  Send,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data
const customers = [
  {
    id: "1",
    name: "Dan L",
    email: "john.doe@example.com",
    phone: "+92 300 1234567",
    totalOrders: 15,
    totalSpent: 125000,
    averageOrderValue: 8333,
    lastOrderDate: new Date("2025-10-15"),
    isActive: true,
    notificationsEnabled: true,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+92 321 7654321",
    totalOrders: 8,
    totalSpent: 67500,
    averageOrderValue: 8437,
    lastOrderDate: new Date("2025-10-14"),
    isActive: true,
    notificationsEnabled: false,
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob.wilson@example.com",
    phone: "+92 333 9876543",
    totalOrders: 22,
    totalSpent: 198000,
    averageOrderValue: 9000,
    lastOrderDate: new Date("2025-10-16"),
    isActive: true,
    notificationsEnabled: true,
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice.brown@example.com",
    phone: "+92 345 1111222",
    totalOrders: 5,
    totalSpent: 42000,
    averageOrderValue: 8400,
    lastOrderDate: new Date("2025-10-10"),
    isActive: true,
    notificationsEnabled: true,
  },
];

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue =
    totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Customers</h1>
        <p className="text-gray-600">Manage your customer relationships</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{totalCustomers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Order Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(avgOrderValue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
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
              placeholder="Search customers by name, email, or phone..."
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
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Avg Order</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-center font-medium">
                    {customer.totalOrders}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(customer.averageOrderValue)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(customer.lastOrderDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant={customer.isActive ? "success" : "secondary"}>
                        {customer.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {customer.notificationsEnabled && (
                        <Badge variant="default" className="text-xs">
                          🔔 Notifications
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" title="View Details">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" title="Edit Customer">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Send Notification">
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" title="WhatsApp">
                        <MessageSquare className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredCustomers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No customers found</h3>
            <p className="text-gray-600">Try adjusting your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
