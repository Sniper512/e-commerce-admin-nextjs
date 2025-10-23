'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Filter,
    Package,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Edit,
    Trash2,
    Calendar,
    Box,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BatchService from '@/services/batchService';
import { Batch } from '@/types';

export default function BatchesPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBatches();
    }, []);

    const loadBatches = async () => {
        try {
            setLoading(true);
            const data = await BatchService.getAllBatches();
            setBatches(data);
        } catch (error) {
            console.error('Error loading batches:', error);
            alert('Failed to load batches');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this batch?')) {
            return;
        }

        try {
            await BatchService.deleteBatch(id);
            alert('Batch deleted successfully!');
            loadBatches();
        } catch (error) {
            console.error('Error deleting batch:', error);
            alert('Failed to delete batch');
        }
    };

    const handleStatusChange = async (id: string, newStatus: 'active' | 'expired' | 'recalled') => {
        try {
            await BatchService.updateBatchStatus(id, newStatus);
            loadBatches();
        } catch (error) {
            console.error('Error updating batch status:', error);
            alert('Failed to update batch status');
        }
    };

    const filteredBatches = batches.filter((batch) => {
        const matchesSearch =
            batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (batch.productName && batch.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (batch.supplier && batch.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesFilter =
            filterStatus === 'all' ||
            (filterStatus === 'active' && batch.status === 'active') ||
            (filterStatus === 'expired' && batch.status === 'expired') ||
            (filterStatus === 'recalled' && batch.status === 'recalled') ||
            (filterStatus === 'expiring' && isExpiringSoon(batch));
        return matchesSearch && matchesFilter;
    });

    const isExpiringSoon = (batch: Batch): boolean => {
        const now = new Date();
        const expiryDate = new Date(batch.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && batch.status === 'active';
    };

    const isExpired = (batch: Batch): boolean => {
        const now = new Date();
        const expiryDate = new Date(batch.expiryDate);
        return expiryDate < now;
    };

    const getDaysUntilExpiry = (batch: Batch): number => {
        const now = new Date();
        const expiryDate = new Date(batch.expiryDate);
        return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    // Calculate stats
    const stats = {
        total: batches.length,
        active: batches.filter((b) => b.status === 'active').length,
        expiring: batches.filter(isExpiringSoon).length,
        expired: batches.filter((b) => b.status === 'expired' || isExpired(b)).length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Batch Management</h1>
                        <p className="text-gray-600">Track and manage product batches with expiry dates</p>
                    </div>
                    <Button onClick={() => router.push('/dashboard/batches/add')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Batch
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Batches</p>
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
                                    <p className="text-sm font-medium text-gray-600">Active Batches</p>
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
                                    <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
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
                                    <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                                </div>
                                <XCircle className="h-8 w-8 text-red-600" />
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
                                        placeholder="Search by batch ID, product, or supplier..."
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
                                <option value="expiring">Expiring Soon</option>
                                <option value="expired">Expired</option>
                                <option value="recalled">Recalled</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Batches Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Batches</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600">Loading batches...</p>
                            </div>
                        ) : filteredBatches.length === 0 ? (
                            <div className="text-center py-8">
                                <Box className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">No batches found</p>
                                <Button onClick={() => router.push('/dashboard/batches/add')}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Your First Batch
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Batch ID</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Quantity</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Manufacturing Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Expiry Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                            <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBatches.map((batch) => {
                                            const daysUntilExpiry = getDaysUntilExpiry(batch);
                                            const expired = isExpired(batch);
                                            const expiringSoon = isExpiringSoon(batch);

                                            return (
                                                <tr key={batch.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{batch.batchId}</div>
                                                        {batch.supplier && (
                                                            <div className="text-xs text-gray-600">
                                                                Supplier: {batch.supplier}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium">{batch.productName || 'N/A'}</div>
                                                        {batch.location && (
                                                            <div className="text-xs text-gray-600">
                                                                Location: {batch.location}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <span className="font-medium">{batch.remainingQuantity}</span>
                                                            <span className="text-gray-600"> / {batch.quantity}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-600">
                                                            {Math.round((batch.remainingQuantity / batch.quantity) * 100)}% remaining
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center text-sm">
                                                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                                            {new Date(batch.manufacturingDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center text-sm">
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
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge
                                                            className={
                                                                batch.status === 'active' && !expired && !expiringSoon
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : batch.status === 'active' && expiringSoon
                                                                    ? 'bg-orange-100 text-orange-800'
                                                                    : batch.status === 'recalled'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }
                                                        >
                                                            {expired || batch.status === 'expired'
                                                                ? 'Expired'
                                                                : expiringSoon
                                                                ? 'Expiring Soon'
                                                                : batch.status === 'recalled'
                                                                ? 'Recalled'
                                                                : 'Active'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(`/dashboard/batches/${batch.id}`)}
                                                                title="View details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => router.push(`/dashboard/batches/${batch.id}/edit`)}
                                                                title="Edit batch"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDelete(batch.id)}
                                                                title="Delete batch"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-600" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
