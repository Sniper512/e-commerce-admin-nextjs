'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CartonProductSearch } from '@/components/ui/carton-product-search';
import { ArrowLeft, Plus, Trash2, Package, DollarSign, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CartonService from '@/services/cartonService';
import { Carton, CartonProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductInCarton extends CartonProductItem {
    tempId: string;
}

export default function EditCartonPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        supplier: '',
        purchaseDate: '',
        notes: '',
        status: 'active' as 'active' | 'archived' | 'shipped',
    });
    const [products, setProducts] = useState<ProductInCarton[]>([]);

    useEffect(() => {
        loadCarton();
    }, [params.id]);

    const loadCarton = async () => {
        try {
            setLoading(true);
            const carton = await CartonService.getCartonById(params.id);
            if (carton) {
                setFormData({
                    name: carton.name,
                    description: carton.description || '',
                    supplier: carton.supplier || '',
                    purchaseDate: carton.purchaseDate
                        ? (typeof carton.purchaseDate === 'string'
                            ? carton.purchaseDate
                            : carton.purchaseDate.toISOString().split('T')[0])
                        : '',
                    notes: carton.notes || '',
                    status: carton.status,
                });

                // Add tempId to products for tracking
                const productsWithTempId: ProductInCarton[] = carton.products.map((p, index) => ({
                    ...p,
                    tempId: `existing-${index}`,
                }));
                setProducts(productsWithTempId);
            } else {
                alert('Carton not found');
                router.push('/dashboard/cartons');
            }
        } catch (error) {
            console.error('Error loading carton:', error);
            alert('Failed to load carton');
            router.push('/dashboard/cartons');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddProduct = (productId: string, productName: string, sku: string, imageUrl?: string) => {
        // Check if product already exists
        if (products.some(p => p.productId === productId)) {
            alert('This product is already in the carton');
            return;
        }

        const newProduct: ProductInCarton = {
            tempId: `temp-${Date.now()}`,
            productId,
            productName,
            sku,
            imageUrl,
            quantity: 1,
            costPerUnit: 0,
            totalCost: 0,
        };

        setProducts(prev => [...prev, newProduct]);
    };

    const handleProductChange = (tempId: string, field: 'quantity' | 'costPerUnit', value: number) => {
        setProducts(prev =>
            prev.map(product => {
                if (product.tempId === tempId) {
                    const updatedProduct = { ...product, [field]: value };
                    updatedProduct.totalCost = updatedProduct.quantity * updatedProduct.costPerUnit;
                    return updatedProduct;
                }
                return product;
            })
        );
    };

    const handleRemoveProduct = (tempId: string) => {
        setProducts(prev => prev.filter(p => p.tempId !== tempId));
    };

    const calculateTotals = () => {
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalCost = products.reduce((sum, p) => sum + p.totalCost, 0);
        return { totalQuantity, totalCost };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.name.trim()) {
            alert('Please enter a carton name');
            return;
        }

        if (products.length === 0) {
            alert('Please add at least one product to the carton');
            return;
        }

        // Check if all products have quantity and cost
        const invalidProducts = products.filter(p => p.quantity <= 0 || p.costPerUnit <= 0);
        if (invalidProducts.length > 0) {
            alert('All products must have a quantity and cost per unit greater than 0');
            return;
        }

        try {
            setSaving(true);

            const { totalQuantity, totalCost } = calculateTotals();

            // Remove tempId from products before saving
            const cleanProducts: CartonProductItem[] = products.map(({ tempId, ...rest }) => rest);

            const updateData = {
                name: formData.name,
                description: formData.description,
                products: cleanProducts,
                totalQuantity,
                totalCost,
                status: formData.status,
                supplier: formData.supplier,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
                notes: formData.notes,
            };

            await CartonService.updateCarton(params.id, updateData);
            alert('Carton updated successfully!');
            router.push(`/dashboard/cartons/${params.id}`);
        } catch (error) {
            console.error('Error updating carton:', error);
            alert('Failed to update carton. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading carton...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const { totalQuantity, totalCost } = calculateTotals();

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/cartons/${params.id}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Edit Carton</h1>
                            <p className="text-gray-600">Update carton information and products</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Carton Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Carton Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g., Winter Collection Batch 1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <Input
                                        id="supplier"
                                        value={formData.supplier}
                                        onChange={(e) => handleInputChange('supplier', e.target.value)}
                                        placeholder="Supplier name"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Brief description of this carton"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                                    <Input
                                        id="purchaseDate"
                                        type="date"
                                        value={formData.purchaseDate}
                                        onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <select
                                        id="status"
                                        value={formData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
                                        <option value="shipped">Shipped</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Additional notes or comments"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Products Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Products in Carton</CardTitle>
                                <div className="text-sm text-gray-600">
                                    {products.length} product(s) added
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Add Product Dropdown */}
                            <div>
                                <Label>Add Product</Label>
                                <CartonProductSearch
                                    onSelect={handleAddProduct}
                                    placeholder="Search and select products to add..."
                                />
                            </div>

                            {/* Products List */}
                            {products.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No products added yet</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Use the search above to add products to this carton
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {products.map((product) => (
                                        <div
                                            key={product.tempId}
                                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                                        >
                                            {/* Product Image and Info */}
                                            <div className="flex items-center gap-3 flex-1">
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.productName}
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{product.productName}</div>
                                                    <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                                </div>
                                            </div>

                                            {/* Quantity Input */}
                                            <div className="w-24">
                                                <Label className="text-xs">Quantity</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={product.quantity}
                                                    onChange={(e) =>
                                                        handleProductChange(product.tempId, 'quantity', Number(e.target.value))
                                                    }
                                                    className="text-sm"
                                                />
                                            </div>

                                            {/* Cost Per Unit Input */}
                                            <div className="w-32">
                                                <Label className="text-xs">Cost/Unit</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={product.costPerUnit}
                                                    onChange={(e) =>
                                                        handleProductChange(product.tempId, 'costPerUnit', Number(e.target.value))
                                                    }
                                                    className="text-sm"
                                                />
                                            </div>

                                            {/* Total Cost */}
                                            <div className="w-32 text-right">
                                                <Label className="text-xs">Total</Label>
                                                <div className="font-semibold text-sm mt-2">
                                                    {formatCurrency(product.totalCost)}
                                                </div>
                                            </div>

                                            {/* Remove Button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveProduct(product.tempId)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Totals Summary */}
                            {products.length > 0 && (
                                <div className="border-t pt-4 mt-4">
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-600">Total Products:</span>
                                        <span className="font-medium">{products.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mb-2">
                                        <span className="text-gray-600">Total Quantity:</span>
                                        <span className="font-medium">{totalQuantity}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-lg font-semibold">
                                        <span>Total Cost:</span>
                                        <span className="text-blue-600">{formatCurrency(totalCost)}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link href={`/dashboard/cartons/${params.id}`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Update Carton
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
