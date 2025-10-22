'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Package,
    Eye,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { productService } from '@/services/productService';
import CategoryService from '@/services/categoryService';
import type { Product, Category } from '@/types';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/images/default-product.svg';

export default function ProductsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load products and categories from Firebase on component mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [fetchedProducts, fetchedCategories] = await Promise.all([
                productService.getAll(),
                CategoryService.getAllCategories()
            ]);
            setProducts(fetchedProducts);
            setCategories(fetchedCategories);
        } catch (err) {
            console.error('Error loading data:', err);
            setError('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to get category name from ID
    const getCategoryName = (categoryId: string): string => {
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : categoryId;
    };

    const filteredProducts = products.filter(product =>
        product.info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Products</h1>
                        <p className="text-gray-600">Manage your product inventory</p>
                    </div>
                    <Link href="/dashboard/products/add">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                                <Input
                                    placeholder="Search products by name or SKU..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline">
                                <Filter className="mr-2 h-4 w-4" />
                                Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Products Grid */}
                {loading ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
                            <h3 className="text-lg font-semibold mb-2">Loading products...</h3>
                        </CardContent>
                    </Card>
                ) : error ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-red-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2 text-red-600">Error</h3>
                            <p className="text-gray-600 mb-4">{error}</p>
                            <Button onClick={loadData}>Try Again</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProducts.map((product) => {
                            const primaryImage = product.multimedia.images.find(img => img.isPrimary)?.url || product.multimedia.images[0]?.url;
                            const categoryId = product.info.categories[0];
                            const categoryName = categoryId ? getCategoryName(categoryId) : 'Uncategorized';
                            const stock = product.inventory.stockQuantity;
                            const minStock = product.inventory.minimumStockQuantity;
                            const isLowStock = stock < minStock;

                            return (
                                <Card key={product.id} className="overflow-hidden">
                                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                                        <img
                                            src={primaryImage || DEFAULT_PRODUCT_IMAGE}
                                            alt={product.info.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                            }}
                                        />
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold line-clamp-1">{product.info.name}</h3>
                                                    <p className="text-sm text-gray-600">{product.sku}</p>
                                                </div>
                                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Category:</span>
                                                <span className="font-medium">{categoryName}</span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Price:</span>
                                                <span className="font-bold text-lg">{formatCurrency(product.pricing.price)}</span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Stock:</span>
                                                <span className={`font-medium ${isLowStock ? 'text-red-600' : 'text-green-600'}`}>
                                                    {stock} units
                                                </span>
                                            </div>

                                            {isLowStock && (
                                                <Badge variant="warning" className="w-full justify-center">
                                                    Low Stock Alert
                                                </Badge>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <Link href={`/dashboard/products/${product.id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Eye className="mr-1 h-3 w-3" />
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={`/dashboard/products/${product.id}`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full">
                                                        <Edit className="mr-1 h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (confirm('Are you sure you want to delete this product?')) {
                                                            try {
                                                                await productService.delete(product.id);
                                                                await loadData();
                                                            } catch (err) {
                                                                alert('Failed to delete product');
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {filteredProducts.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No products found</h3>
                            <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
