'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BatchService from '@/services/batchService';
import { productService } from '@/services/productService';
import { Batch, Product } from '@/types';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Package,
    Calendar,
    MapPin,
    User,
    FileText,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

export default function BatchDetailPage() {
    const router = useRouter();
    const params = useParams();
    const batchId = params.id as string;

    const [batch, setBatch] = useState<Batch | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadBatch();
    }, [batchId]);

    const loadBatch = async () => {
        try {
            setLoading(true);
            const batchData = await BatchService.getBatchById(batchId);
            if (batchData) {
                setBatch(batchData);
                // Load product details
                if (batchData.productId) {
                    const productData = await productService.getById(batchData.productId);
                    setProduct(productData);
                }
            } else {
                alert('Batch not found');
                router.push('/dashboard/batches');
            }
        } catch (error) {
            console.error('Error loading batch:', error);
            alert('Failed to load batch details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!batch) return;

        const confirmed = confirm(
            `Are you sure you want to delete batch "${batch.batchId}"?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            await BatchService.deleteBatch(batch.id);
            alert('Batch deleted successfully');
            router.push('/dashboard/batches');
        } catch (error) {
            console.error('Error deleting batch:', error);
            alert('Failed to delete batch');
            setDeleting(false);
        }
    };

    const getStatusBadge = (status: string, expiryDate: Date) => {
        const now = new Date();
        const isExpired = expiryDate < now;
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

        if (status === 'recalled') {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="w-3 h-3 mr-1" />
                    Recalled
                </Badge>
            );
        }

        if (isExpired || status === 'expired') {
            return (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expired
                </Badge>
            );
        }

        if (isExpiringSoon) {
            return (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Expiring Soon ({daysUntilExpiry} days)
                </Badge>
            );
        }

        return (
            <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
            </Badge>
        );
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-2 text-gray-600">Loading batch details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!batch) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-gray-600">Batch not found</p>
                        <Link href="/dashboard/batches">
                            <Button className="mt-4">Back to Batches</Button>
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">Batch Details</h1>
                            {getStatusBadge(batch.status, batch.expiryDate)}
                        </div>
                        <p className="text-sm text-gray-500">
                            Batch ID: <span className="font-mono font-medium">{batch.batchId}</span>
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/batches">
                            <Button variant="outline" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                        </Link>
                        <Link href={`/dashboard/batches/${batch.id}/edit`}>
                            <Button variant="outline" className="gap-2">
                                <Edit className="w-4 h-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Product Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {product ? (
                                    <div className="flex items-center gap-4">
                                        {product.multimedia?.images && product.multimedia.images.length > 0 && (
                                            <img
                                                src={product.multimedia.images[0].url}
                                                alt={product.info.name}
                                                className="w-20 h-20 object-cover rounded-lg border"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{product.info.name}</h3>
                                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                                            <Link
                                                href={`/dashboard/products/${product.id}`}
                                                className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                                            >
                                                View Product Details →
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Product information not available</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Batch Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5" />
                                    Batch Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Manufacturing Date</label>
                                        <p className="text-lg font-medium mt-1">
                                            {formatDate(batch.manufacturingDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                                        <p className="text-lg font-medium mt-1">
                                            {formatDate(batch.expiryDate)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Initial Quantity</label>
                                        <p className="text-lg font-medium mt-1 flex items-center gap-2">
                                            {batch.quantity.toLocaleString()}
                                            <span className="text-sm text-gray-500">units</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Remaining Quantity</label>
                                        <p className="text-lg font-medium mt-1 flex items-center gap-2">
                                            {batch.remainingQuantity.toLocaleString()}
                                            <span className="text-sm text-gray-500">units</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Quantity Change Indicator */}
                                {batch.quantity !== batch.remainingQuantity && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-sm">
                                            {batch.remainingQuantity < batch.quantity ? (
                                                <>
                                                    <TrendingDown className="w-4 h-4 text-blue-600" />
                                                    <span className="text-blue-800">
                                                        <strong>
                                                            {(batch.quantity - batch.remainingQuantity).toLocaleString()}
                                                        </strong>{' '}
                                                        units have been used from this batch (
                                                        {Math.round(
                                                            ((batch.quantity - batch.remainingQuantity) /
                                                                batch.quantity) *
                                                            100
                                                        )}
                                                        % utilized)
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                                    <span className="text-green-800">
                                                        Quantity has been adjusted
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Additional Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Additional Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {batch.supplier && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <User className="w-4 h-4" />
                                                Supplier
                                            </label>
                                            <p className="text-base mt-1">{batch.supplier}</p>
                                        </div>
                                    )}
                                    {batch.location && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                Storage Location
                                            </label>
                                            <p className="text-base mt-1">{batch.location}</p>
                                        </div>
                                    )}
                                    {batch.notes && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Notes</label>
                                            <p className="text-base mt-1 whitespace-pre-wrap">{batch.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Status Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-500">Current Status</label>
                                        <div className="mt-1">{getStatusBadge(batch.status, batch.expiryDate)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Days Until Expiry</label>
                                        <p className="text-2xl font-bold mt-1">
                                            {Math.max(
                                                0,
                                                Math.ceil(
                                                    (batch.expiryDate.getTime() - new Date().getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                                )
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Record Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <label className="text-gray-500">Created</label>
                                        <p className="font-medium mt-1">
                                            {batch.createdAt
                                                ? formatDate(batch.createdAt)
                                                : 'Not available'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-gray-500">Last Updated</label>
                                        <p className="font-medium mt-1">
                                            {batch.updatedAt
                                                ? formatDate(batch.updatedAt)
                                                : 'Not available'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
