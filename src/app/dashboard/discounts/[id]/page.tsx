'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Percent,
    DollarSign,
    Calendar,
    Tag,
    FileText,
    ShoppingBag,
    FolderOpen,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DiscountService } from '@/services/discountService';
import CategoryService from '@/services/categoryService';
import { productService } from '@/services/productService';
import { Discount, Category, Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function DiscountDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [discount, setDiscount] = useState<Discount | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [discountData, categoriesData, productsData] = await Promise.all([
                DiscountService.getDiscountById(id),
                CategoryService.getAllCategories(),
                productService.getAll({ isActive: true }),
            ]);

            if (!discountData) {
                alert('Discount not found');
                router.push('/dashboard/discounts');
                return;
            }

            setDiscount(discountData);
            setCategories(categoriesData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading discount:', error);
            alert('Failed to load discount');
            router.push('/dashboard/discounts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this discount? This will remove the discount from all associated products.')) {
            return;
        }

        try {
            if (!discount) return;

            // Remove discount ID from all applicable products
            if (discount.applicableTo === 'products' && discount.applicableProducts && discount.applicableProducts.length > 0) {
                const updatePromises = discount.applicableProducts.map(async (productId) => {
                    try {
                        const product = await productService.getById(productId);
                        if (product) {
                            const existingDiscountIds = product.pricing.discountIds || [];
                            const updatedDiscountIds = existingDiscountIds.filter(discountId => discountId !== id);

                            await productService.update(productId, {
                                pricing: {
                                    ...product.pricing,
                                    discountIds: updatedDiscountIds,
                                },
                            });
                        }
                    } catch (error) {
                        console.error(`Error removing discount from product ${productId}:`, error);
                    }
                });

                await Promise.all(updatePromises);
            }

            // Remove discount ID from products in applicable categories
            if (discount.applicableTo === 'categories' && discount.applicableCategories && discount.applicableCategories.length > 0) {
                const updatePromises = discount.applicableCategories.map(async (categoryId) => {
                    try {
                        const category = await CategoryService.getCategoryById(categoryId);
                        if (category && category.productIds.length > 0) {
                            const productUpdatePromises = category.productIds.map(async (productId) => {
                                try {
                                    const product = await productService.getById(productId);
                                    if (product) {
                                        const existingDiscountIds = product.pricing.discountIds || [];
                                        const updatedDiscountIds = existingDiscountIds.filter(discountId => discountId !== id);

                                        await productService.update(productId, {
                                            pricing: {
                                                ...product.pricing,
                                                discountIds: updatedDiscountIds,
                                            },
                                        });
                                    }
                                } catch (error) {
                                    console.error(`Error removing discount from product ${productId}:`, error);
                                }
                            });
                            await Promise.all(productUpdatePromises);
                        }
                    } catch (error) {
                        console.error(`Error removing discount from category ${categoryId} products:`, error);
                    }
                });

                await Promise.all(updatePromises);
            }

            // Finally, delete the discount
            await DiscountService.deleteDiscount(id);
            alert('Discount deleted successfully!');
            router.push('/dashboard/discounts');
        } catch (error) {
            console.error('Error deleting discount:', error);
            alert('Failed to delete discount');
        }
    };

    const handleToggleStatus = async () => {
        try {
            await DiscountService.toggleDiscountStatus(id);
            loadData(); // Reload data
        } catch (error) {
            console.error('Error toggling discount status:', error);
            alert('Failed to update discount status');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading discount details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!discount) {
        return null;
    }

    // Get names for products and categories
    const getProductNames = (productIds?: string[]) => {
        if (!productIds || productIds.length === 0) return [];
        return products
            .filter((p) => productIds.includes(p.id))
            .map((p) => p.info.name);
    };

    const getCategoryNames = (categoryIds?: string[]) => {
        if (!categoryIds || categoryIds.length === 0) return [];
        return categories
            .filter((c) => categoryIds.includes(c.id))
            .map((c) => c.name);
    };

    const productNames = getProductNames(discount.applicableProducts);
    const categoryNames = getCategoryNames(discount.applicableCategories);

    // Calculate discount status
    const now = new Date();
    const startDate = discount.startDate instanceof Date ? discount.startDate : new Date(discount.startDate);
    const endDate = discount.endDate instanceof Date ? discount.endDate : new Date(discount.endDate);

    const isUpcoming = now < startDate;
    const isExpired = now > endDate;
    const isOngoing = !isUpcoming && !isExpired && discount.isActive;

    // Calculate usage progress
    const usagePercentage = discount.limitationType !== 'unlimited' && discount.limitationTimes
        ? Math.round(((discount.currentUsageCount || 0) / discount.limitationTimes) * 100)
        : 0;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/dashboard/discounts')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Discounts
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboard/discounts/${id}/edit`)}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                        <Button variant="outline" onClick={handleToggleStatus}>
                            {discount.isActive ? (
                                <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Deactivate
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                </>
                            )}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Discount Name and Status */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-2xl">{discount.name}</CardTitle>
                                {discount.description && (
                                    <p className="text-gray-600 mt-2">{discount.description}</p>
                                )}
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                                <Badge variant={discount.isActive ? 'default' : 'secondary'}>
                                    {discount.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {isOngoing && (
                                    <Badge className="bg-green-500">Ongoing</Badge>
                                )}
                                {isUpcoming && (
                                    <Badge className="bg-yellow-500">Upcoming</Badge>
                                )}
                                {isExpired && (
                                    <Badge className="bg-red-500">Expired</Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Discount Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Tag className="h-5 w-5 mr-2" />
                                Discount Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-600">Discount Type</Label>
                                <div className="flex items-center mt-1">
                                    {discount.type === 'percentage' ? (
                                        <>
                                            <Percent className="h-5 w-5 mr-2 text-blue-600" />
                                            <span className="text-lg font-semibold">
                                                {discount.value}% Off
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                                            <span className="text-lg font-semibold">
                                                {formatCurrency(discount.value)} Off
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label className="text-gray-600">Applies To</Label>
                                <div className="mt-1 text-base font-medium capitalize">
                                    {discount.applicableTo === 'order' && 'Total Order Amount'}
                                    {discount.applicableTo === 'products' && 'Specific Products'}
                                    {discount.applicableTo === 'categories' && 'Product Categories'}
                                </div>
                            </div>

                            {discount.minPurchaseAmount && discount.minPurchaseAmount > 0 && (
                                <div>
                                    <Label className="text-gray-600">Minimum Purchase Amount</Label>
                                    <div className="mt-1 text-base font-semibold text-green-600">
                                        {formatCurrency(discount.minPurchaseAmount)}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-gray-600">Valid Period</Label>
                                <div className="flex items-center mt-1 space-x-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage Limitation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="h-5 w-5 mr-2" />
                                Usage Limitation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-600">Limitation Type</Label>
                                <div className="mt-1">
                                    {discount.limitationType === 'unlimited' && (
                                        <Badge className="bg-green-500">Unlimited</Badge>
                                    )}
                                    {discount.limitationType === 'n_times_only' && (
                                        <Badge className="bg-blue-500">
                                            {discount.limitationTimes} Total Uses
                                        </Badge>
                                    )}
                                    {discount.limitationType === 'n_times_per_customer' && (
                                        <Badge className="bg-purple-500">
                                            {discount.limitationTimes} Per Customer
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {discount.limitationType !== 'unlimited' && (
                                <>
                                    <div>
                                        <Label className="text-gray-600">Current Usage</Label>
                                        <div className="mt-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-2xl font-bold">
                                                    {discount.currentUsageCount}
                                                </span>
                                                <span className="text-gray-600">
                                                    / {discount.limitationTimes}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className={`h-3 rounded-full transition-all ${usagePercentage >= 90
                                                        ? 'bg-red-500'
                                                        : usagePercentage >= 70
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {usagePercentage}% used
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-gray-600">Remaining Uses</Label>
                                        <div className="mt-1 text-2xl font-bold text-blue-600">
                                            {Math.max(0, (discount.limitationTimes || 0) - (discount.currentUsageCount || 0))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Applicable Products */}
                {discount.applicableTo === 'products' && productNames.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <ShoppingBag className="h-5 w-5 mr-2" />
                                Applicable Products ({productNames.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {productNames.map((name, index) => (
                                    <Badge key={index} className="bg-blue-100 text-blue-800 px-3 py-1">
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Applicable Categories */}
                {discount.applicableTo === 'categories' && categoryNames.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FolderOpen className="h-5 w-5 mr-2" />
                                Applicable Categories ({categoryNames.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {categoryNames.map((name, index) => (
                                    <Badge key={index} className="bg-teal-100 text-teal-800 px-3 py-1">
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Admin Comment */}
                {discount.adminComment && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Admin Comment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 whitespace-pre-wrap">{discount.adminComment}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Metadata */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2" />
                            Metadata
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-gray-600">Discount ID</Label>
                            <span className="font-mono text-sm">{discount.id}</span>
                        </div>
                        {discount.createdAt && (
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-600">Created At</Label>
                                <span className="text-sm">
                                    {new Date(discount.createdAt).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {discount.updatedAt && (
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-600">Last Updated</Label>
                                <span className="text-sm">
                                    {new Date(discount.updatedAt).toLocaleString()}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
