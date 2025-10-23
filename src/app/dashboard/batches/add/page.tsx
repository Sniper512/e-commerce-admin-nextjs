'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, ArrowLeft, Scan, Package, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BatchService from '@/services/batchService';
import { productService } from '@/services/productService';
import { Batch, Product } from '@/types';
import { useSymbologyScanner } from '@use-symbology-scanner/react';
import { ProductSearchDropdown } from '@/components/ui/product-search-dropdown';

export default function AddBatchPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [productSearchValue, setProductSearchValue] = useState('');
    const [scannerActive, setScannerActive] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        batchId: '',
        productId: '',
        manufacturingDate: '',
        expiryDate: '',
        quantity: 0,
        supplier: '',
        location: '',
        notes: '',
    });

    // Barcode scanner - handles symbol input from barcode scanner
    const handleSymbol = (symbol: string, matchedSymbologies: string[]) => {
        console.log('Scanned symbol:', symbol, 'Symbologies:', matchedSymbologies);
        handleInputChange('batchId', symbol);
        setScannerActive(true);
        
        // Show feedback (optional: add beep sound)
        const audio = new Audio('/sounds/beep.mp3');
        audio.play().catch(() => {});
        
        // Flash effect - reset active state after 1 second
        setTimeout(() => setScannerActive(false), 1000);
    };

    // Use default target (window.document) to listen for scanner input globally
    useSymbologyScanner(handleSymbol);

    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const productsData = await productService.getAll({ isActive: true });
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading products:', error);
            alert('Failed to load products');
        }
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleProductSelect = (productId: string) => {
        handleInputChange('productId', productId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.batchId.trim()) {
            alert('Please enter or scan a batch ID');
            return;
        }

        if (!formData.productId) {
            alert('Please select a product');
            return;
        }

        if (!formData.manufacturingDate || !formData.expiryDate) {
            alert('Please enter manufacturing and expiry dates');
            return;
        }

        const mfgDate = new Date(formData.manufacturingDate);
        const expDate = new Date(formData.expiryDate);

        if (expDate <= mfgDate) {
            alert('Expiry date must be after manufacturing date');
            return;
        }

        if (formData.quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }

        setLoading(true);

        try {
            // Check if batch ID already exists
            const existingBatch = await BatchService.getBatchByBatchId(formData.batchId);
            if (existingBatch) {
                alert('A batch with this ID already exists');
                setLoading(false);
                return;
            }

            // Get product name
            const product = products.find((p) => p.id === formData.productId);

            const batchData: Omit<Batch, 'id' | 'createdAt' | 'updatedAt'> = {
                batchId: formData.batchId.trim(),
                productId: formData.productId,
                productName: product?.info.name,
                manufacturingDate: mfgDate,
                expiryDate: expDate,
                quantity: formData.quantity,
                remainingQuantity: formData.quantity,
                supplier: formData.supplier.trim() || undefined,
                location: formData.location.trim() || undefined,
                notes: formData.notes.trim() || undefined,
                status: 'active',
            };

            await BatchService.createBatch(batchData);
            alert('Batch created successfully!');
            router.push('/dashboard/batches');
        } catch (error) {
            console.error('Error creating batch:', error);
            alert('Failed to create batch. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Convert products to dropdown format
    const availableProductsForDropdown = products.map((product) => ({
        id: product.id,
        name: product.info.name,
        sku: product.sku,
        price: product.pricing.price,
        image: product.multimedia.images[0]?.url || '/images/default-product.svg',
    }));

    const selectedProduct = products.find((p) => p.id === formData.productId);

    return (
        <DashboardLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Add New Batch</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Scan or enter batch information
                        </p>
                    </div>
                    <Link href="/dashboard/batches">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Batches
                        </Button>
                    </Link>
                </div>

                {/* Scanner Status */}
                <Card className={`mb-6 ${scannerActive ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scan className={`h-6 w-6 ${scannerActive ? 'text-green-600' : 'text-blue-600 animate-pulse'}`} />
                                <div>
                                    <p className="font-medium">
                                        {scannerActive ? '✓ Barcode Scanned!' : 'Scanner Active'}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {scannerActive 
                                            ? 'Batch ID captured successfully!'
                                            : 'Listening for barcode scans... Use your scanner device.'}
                                    </p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                scannerActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-blue-100 text-blue-800'
                            }`}>
                                {scannerActive ? 'Scanned ✓' : 'Listening...'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Batch Identification */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Batch Identification</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="batchId">Batch ID (Barcode) *</Label>
                                        <div className="relative">
                                            <Input
                                                id="batchId"
                                                value={formData.batchId}
                                                onChange={(e) => handleInputChange('batchId', e.target.value)}
                                                placeholder="Scan barcode or enter batch ID manually"
                                                required
                                                className={scannerActive ? 'border-green-500' : ''}
                                            />
                                            <Scan className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Use your barcode scanner device to scan, or type manually
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="product">Product *</Label>
                                        <ProductSearchDropdown
                                            availableProducts={availableProductsForDropdown}
                                            selectedProductId={formData.productId}
                                            onSelect={handleProductSelect}
                                            placeholder="Search and select product..."
                                            searchValue={productSearchValue}
                                            onSearchChange={setProductSearchValue}
                                            defaultProductImage="/images/default-product.svg"
                                        />
                                        {selectedProduct && (
                                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-3">
                                                <img
                                                    src={selectedProduct.multimedia.images[0]?.url || '/images/default-product.svg'}
                                                    alt={selectedProduct.info.name}
                                                    className="w-10 h-10 object-cover rounded"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/images/default-product.svg';
                                                    }}
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm text-blue-900">
                                                        {selectedProduct.info.name}
                                                    </div>
                                                    <div className="text-xs text-blue-700">
                                                        SKU: {selectedProduct.sku}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dates and Quantity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Dates and Quantity</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
                                            <Input
                                                id="manufacturingDate"
                                                type="date"
                                                value={formData.manufacturingDate}
                                                onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="expiryDate">Expiry Date *</Label>
                                            <Input
                                                id="expiryDate"
                                                type="date"
                                                value={formData.expiryDate}
                                                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="quantity">Quantity *</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => handleInputChange('quantity', Number.parseInt(e.target.value))}
                                            placeholder="Enter quantity"
                                            min="1"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Total units in this batch
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Additional Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="supplier">Supplier</Label>
                                        <Input
                                            id="supplier"
                                            value={formData.supplier}
                                            onChange={(e) => handleInputChange('supplier', e.target.value)}
                                            placeholder="Enter supplier name"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="location">Storage Location</Label>
                                        <Input
                                            id="location"
                                            value={formData.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            placeholder="e.g., Warehouse A, Shelf 12"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="notes">Notes</Label>
                                        <textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            placeholder="Additional notes about this batch"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Instructions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-blue-600" />
                                        Instructions
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-gray-600">
                                    <div className="flex gap-2">
                                        <span className="font-semibold text-blue-600">1.</span>
                                        <p>Use your barcode scanner to scan the batch ID, or enter it manually.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-semibold text-blue-600">2.</span>
                                        <p>Select the product this batch belongs to from the dropdown.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-semibold text-blue-600">3.</span>
                                        <p>Enter manufacturing and expiry dates accurately.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="font-semibold text-blue-600">4.</span>
                                        <p>Fill in quantity and additional information.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <Button type="submit" className="w-full gap-2" disabled={loading}>
                                            <Save className="w-4 h-4" />
                                            {loading ? 'Creating...' : 'Create Batch'}
                                        </Button>
                                        <Link href="/dashboard/batches">
                                            <Button type="button" variant="outline" className="w-full" disabled={loading}>
                                                Cancel
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Preview */}
                            {formData.batchId && formData.productId && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm">Preview</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-gray-600">Batch ID:</span>
                                            <p className="font-medium">{formData.batchId}</p>
                                        </div>
                                        {selectedProduct && (
                                            <div>
                                                <span className="text-gray-600">Product:</span>
                                                <p className="font-medium">{selectedProduct.info.name}</p>
                                            </div>
                                        )}
                                        {formData.quantity > 0 && (
                                            <div>
                                                <span className="text-gray-600">Quantity:</span>
                                                <p className="font-medium">{formData.quantity} units</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
