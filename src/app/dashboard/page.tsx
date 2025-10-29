import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Eye,
  RefreshCw,
  Star,
  CreditCard,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// Mock data - Replace with actual Firebase data
const stats = [
  {
    title: "Total Revenue",
    value: formatCurrency(245680),
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Total Orders",
    value: "1,234",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    title: "Total Customers",
    value: "856",
    change: "+4.3%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Total Products",
    value: "342",
    change: "+2.1%",
    trend: "up",
    icon: Package,
  },
];

// Order status summary data
const orderTotals = [
  {
    status: "Pending",
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 2468.8,
    allTime: 2468.8,
  },
  {
    status: "Processing",
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 1957.0,
    allTime: 1957.0,
  },
  {
    status: "Complete",
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 43.5,
    allTime: 43.5,
  },
  {
    status: "Cancelled",
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    thisYear: 0,
    allTime: 0,
  },
];

// Incomplete orders summary
const incompleteOrders = [
  {
    item: "Total unpaid orders (pending payment status)",
    total: 2468.8,
    count: 2,
  },
  { item: "Total not yet shipped orders", total: 4315.0, count: 2 },
  {
    item: "Total incomplete orders (pending order status)",
    total: 2468.8,
    count: 2,
  },
];

// Recent orders with more details
const recentOrders = [
  {
    id: "ORD-001",
    customer: "Dan L",
    total: 12500,
    status: "pending",
    date: "2025-10-15",
    paymentStatus: "pending",
    items: 3,
  },
  {
    id: "ORD-002",
    customer: "Jane Smith",
    total: 8750,
    status: "processing",
    date: "2025-10-15",
    paymentStatus: "paid",
    items: 2,
  },
  {
    id: "ORD-003",
    customer: "Bob Wilson",
    total: 15600,
    status: "shipped",
    date: "2025-10-14",
    paymentStatus: "paid",
    items: 5,
  },
  {
    id: "ORD-004",
    customer: "Alice Brown",
    total: 9200,
    status: "delivered",
    date: "2025-10-14",
    paymentStatus: "paid",
    items: 1,
  },
  {
    id: "ORD-005",
    customer: "Mike Johnson",
    total: 6800,
    status: "pending",
    date: "2025-10-13",
    paymentStatus: "pending",
    items: 4,
  },
];

// Bestsellers by quantity
const bestsellersByQuantity = [
  { name: "Lenovo IdeaCentre", totalQuantity: 1, totalAmount: 500.0 },
  {
    name: "Leica T Mirrorless Digital Camera",
    totalQuantity: 1,
    totalAmount: 530.0,
  },
  { name: "Apple iCam", totalQuantity: 1, totalAmount: 1300.0 },
  { name: "Levi's 511 Jeans", totalQuantity: 1, totalAmount: 43.5 },
  { name: "Night Visions", totalQuantity: 1, totalAmount: 2.8 },
];

// Bestsellers by amount
const bestsellersByAmount = [
  {
    name: "Vintage Style Engagement Ring",
    totalQuantity: 1,
    totalAmount: 2100.0,
  },
  { name: "Apple iCam", totalQuantity: 1, totalAmount: 1300.0 },
  {
    name: "Leica T Mirrorless Digital Camera",
    totalQuantity: 1,
    totalAmount: 530.0,
  },
  { name: "Lenovo IdeaCentre", totalQuantity: 1, totalAmount: 500.0 },
  { name: "Flower Girl Bracelet", totalQuantity: 1, totalAmount: 360.0 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-green-600">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Summary Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Totals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order totals
            </CardTitle>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Order Status</th>
                    <th className="text-center py-2 font-medium">Today</th>
                    <th className="text-center py-2 font-medium">This Week</th>
                    <th className="text-center py-2 font-medium">This Month</th>
                    <th className="text-center py-2 font-medium">This Year</th>
                    <th className="text-center py-2 font-medium">All time</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTotals.map((order) => (
                    <tr key={order.status} className="border-b">
                      <td className="py-3 font-medium">{order.status}</td>
                      <td className="text-center py-3">
                        {formatCurrency(order.today)}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(order.thisWeek)}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(order.thisMonth)}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(order.thisYear)}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(order.allTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Incomplete orders
            </CardTitle>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incompleteOrders.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.item}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium">{formatCurrency(item.total)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.count} - view all
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Latest Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Order ID</th>
                  <th className="text-left py-2 font-medium">Customer</th>
                  <th className="text-center py-2 font-medium">Items</th>
                  <th className="text-center py-2 font-medium">Total</th>
                  <th className="text-center py-2 font-medium">Status</th>
                  <th className="text-center py-2 font-medium">Payment</th>
                  <th className="text-center py-2 font-medium">Date</th>
                  <th className="text-center py-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 font-medium">{order.id}</td>
                    <td className="py-3">{order.customer}</td>
                    <td className="text-center py-3">{order.items}</td>
                    <td className="text-center py-3 font-medium">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="text-center py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-center py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                          order.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="text-center py-3 text-sm text-gray-600">
                      {order.date}
                    </td>
                    <td className="text-center py-3">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bestsellers Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bestsellers by Quantity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Bestsellers by quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Name</th>
                    <th className="text-center py-2 font-medium">
                      Total quantity
                    </th>
                    <th className="text-center py-2 font-medium">
                      Total amount (excl tax)
                    </th>
                    <th className="text-center py-2 font-medium">View</th>
                  </tr>
                </thead>
                <tbody>
                  {bestsellersByQuantity.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{product.name}</td>
                      <td className="text-center py-3">
                        {product.totalQuantity}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(product.totalAmount)}
                      </td>
                      <td className="text-center py-3">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
              <p className="text-sm text-gray-600">1-5 of 13 items</p>
            </div>
          </CardContent>
        </Card>

        {/* Bestsellers by Amount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Bestsellers by amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Name</th>
                    <th className="text-center py-2 font-medium">
                      Total quantity
                    </th>
                    <th className="text-center py-2 font-medium">
                      Total amount (excl tax)
                    </th>
                    <th className="text-center py-2 font-medium">View</th>
                  </tr>
                </thead>
                <tbody>
                  {bestsellersByAmount.map((product, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{product.name}</td>
                      <td className="text-center py-3">
                        {product.totalQuantity}
                      </td>
                      <td className="text-center py-3">
                        {formatCurrency(product.totalAmount)}
                      </td>
                      <td className="text-center py-3">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
              <p className="text-sm text-gray-600">1-5 of 13 items</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
