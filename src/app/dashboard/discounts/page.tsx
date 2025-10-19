'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Percent,
    DollarSign
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

export default function DiscountsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Mock discount data
    const discounts = [
        {
            id: '1',
            name: 'Summer Sale 2025',
            description: 'Summer collection discount',
            type: 'percentage',
            value: 20,
            startDate: '2025-06-01',
            endDate: '2025-08-31',
            isActive: true,
            usedCount: 145,
            usageLimit: 1000,
            applicableProducts: ['prod1', 'prod2'],
            applicableCategories: ['cat1'],
            minimumOrderAmount: 50
        },
        {
            id: '2',
            name: 'New Customer Welcome',
            description: 'First time buyer discount',
            type: 'fixed_amount',
            value: 10,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            isActive: true,
            usedCount: 89,
            usageLimit: null,
            applicableProducts: [],
            applicableCategories: [],
            minimumOrderAmount: 25
        },
        {
            id: '3',
            name: 'Winter Clearance',
            description: 'End of season clearance',
            type: 'percentage',
            value: 35,
            startDate: '2024-12-01',
            endDate: '2025-02-28',
            isActive: false,
            usedCount: 234,
            usageLimit: 500,
            applicableProducts: [],
            applicableCategories: ['winter-clothes'],
            minimumOrderAmount: 100
        }
    ];

    const filteredDiscounts = discounts.filter(discount => {
        const matchesSearch = discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            discount.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' ||
            (filterStatus === 'active' && discount.isActive) ||
            (filterStatus === 'inactive' && !discount.isActive);
        return matchesSearch && matchesFilter;
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Discounts Management</h1>
                        <p className="text-gray-600">Create and manage promotional discounts for your products</p>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Discount
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Discounts</p>
                                    <p className="text-2xl font-bold">12</p>
                                </div>
                                <Percent className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Discounts</p>
                                    <p className="text-2xl font-bold">8</p>
                                </div>
                                <Calendar className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Savings</p>
                                    <p className="text-2xl font-bold">{formatCurrency(15420)}</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Usage This Month</p>
                                    <p className="text-2xl font-bold">234</p>
                                </div>
                                <Percent className="h-8 w-8 text-purple-600" />
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
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
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
                    <CardHeader>
                        <CardTitle>All Discounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="table-header">Name</th>
                                        <th className="table-header">Type</th>
                                        <th className="table-header">Value</th>
                                        <th className="table-header">Period</th>
                                        <th className="table-header">Usage</th>
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
                                                    <p className="text-sm text-gray-600">{discount.description}</p>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${discount.type === 'percentage'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {discount.type === 'percentage' ? (
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
                                                <span className="font-medium">
                                                    {discount.type === 'percentage'
                                                        ? `${discount.value}%`
                                                        : formatCurrency(discount.value)
                                                    }
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm">
                                                    <p>{discount.startDate}</p>
                                                    <p className="text-gray-600">to {discount.endDate}</p>
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <div className="text-sm">
                                                    <p className="font-medium">{discount.usedCount}</p>
                                                    {discount.usageLimit && (
                                                        <p className="text-gray-600">of {discount.usageLimit}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="table-cell">
                                                <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${discount.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {discount.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}