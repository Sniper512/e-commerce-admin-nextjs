'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Save,
    ArrowLeft,
    Plus,
    Trash2,
    Upload,
    X,
    ShoppingCart,
    Package,
    DollarSign,
    Image as ImageIcon,
    Users,
    History,
    Link as LinkIcon,
    Loader2,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { DiscountService } from '@/services/discountService';
import type { Product, Discount } from '@/types';
import { ProductSearchDropdown } from '@/components/ui/product-search-dropdown';
import { DiscountSearchDropdown } from '@/components/ui/discount-search-dropdown';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/images/default-product.svg';

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState('info');
    const [tierPrices, setTierPrices] = useState([
        { id: '1', quantity: 10, price: 90, customerRoleId: '' }
    ]);
    const [images, setImages] = useState([
        { id: '1', url: '/placeholder-product.jpg', altText: 'Product Image', isPrimary: true, sortOrder: 1 }
    ]);
    const [relatedProducts, setRelatedProducts] = useState<Array<{ productId: string, productName: string, price: number, imageUrl?: string }>>([]);
    const [crossSellProducts, setCrossSellProducts] = useState<Array<{ productId: string, productName: string, price: number, imageUrl?: string, sortOrder: number }>>([]);
    const [availableProductsFromDB, setAvailableProductsFromDB] = useState<Product[]>([]);
    const [relatedProductSearch, setRelatedProductSearch] = useState('');
    const [crossSellProductSearch, setCrossSellProductSearch] = useState('');
    const [availableDiscounts, setAvailableDiscounts] = useState<Discount[]>([]);
    const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
    const [discountSearchValue, setDiscountSearchValue] = useState('');

    // Default product image
    const defaultProductImage = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop';

    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        sku: '',
        categories: [] as string[],
        manufacturer: '',
        productTags: [] as string[],
        isPublished: true,
        allowCustomerReviews: true,
        markAsNew: false,
        markAsNewStartDate: undefined as Date | undefined,
        markAsNewEndDate: undefined as Date | undefined,
        price: 0,
        productCost: 0,
        minBuy: 1,
        maxBuy: 999,
        stockQuantity: 0,
        minimumStockQuantity: 10,
        lowStockActivity: 'notify' as 'disable' | 'unpublish' | 'notify',
        notifyForQtyBelow: 5,
        isNotReturnable: false,
        trackInventory: true,
    });

    // Load product data on component mount
    useEffect(() => {
        loadProduct();
        loadAvailableProducts();
        loadDiscounts();
    }, [productId]);

    const loadAvailableProducts = async () => {
        try {
            const products = await productService.getAll({ isActive: true });
            setAvailableProductsFromDB(products);
        } catch (error) {
            console.error('Error loading available products:', error);
        }
    };

    const loadDiscounts = async () => {
        try {
            const discounts = await DiscountService.getAllDiscounts();
            setAvailableDiscounts(discounts);
        } catch (error) {
            console.error('Error loading discounts:', error);
        }
    };

    // Use Firebase products for dropdowns (exclude current product)
    const availableProducts = useMemo(() => {
        return availableProductsFromDB
            .filter(p => p.id !== productId) // Exclude current product
            .map(p => ({
                id: p.id,
                name: p.info.name,
                sku: p.sku,
                price: p.pricing.price,
                image: p.multimedia.images[0]?.url || defaultProductImage
            }));
    }, [availableProductsFromDB, productId]);

    const loadProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedProduct = await productService.getById(productId);

            if (fetchedProduct) {
                setProduct(fetchedProduct);

                // Populate form data
                setFormData({
                    name: fetchedProduct.info.name,
                    description: fetchedProduct.info.description || '',
                    sku: fetchedProduct.sku,
                    categories: fetchedProduct.info.categories,
                    manufacturer: fetchedProduct.info.manufacturer || '',
                    productTags: fetchedProduct.info.productTags || [],
                    isPublished: fetchedProduct.info.isPublished,
                    allowCustomerReviews: fetchedProduct.info.allowCustomerReviews,
                    markAsNew: fetchedProduct.info.markAsNew,
                    markAsNewStartDate: fetchedProduct.info.markAsNewStartDate,
                    markAsNewEndDate: fetchedProduct.info.markAsNewEndDate,
                    price: fetchedProduct.pricing.price,
                    productCost: fetchedProduct.pricing.productCost || 0,
                    minBuy: fetchedProduct.pricing.minBuy || 1,
                    maxBuy: fetchedProduct.pricing.maxBuy || 999,
                    stockQuantity: fetchedProduct.inventory.stockQuantity,
                    minimumStockQuantity: fetchedProduct.inventory.minimumStockQuantity,
                    lowStockActivity: fetchedProduct.inventory.lowStockActivity,
                    notifyForQtyBelow: fetchedProduct.inventory.notifyForQtyBelow,
                    isNotReturnable: fetchedProduct.inventory.isNotReturnable,
                    trackInventory: fetchedProduct.inventory.trackInventory,
                });

                // Set tier prices
                if (fetchedProduct.pricing.tierPrices && fetchedProduct.pricing.tierPrices.length > 0) {
                    setTierPrices(fetchedProduct.pricing.tierPrices.map((tp, index) => ({
                        id: index.toString(),
                        quantity: tp.quantity,
                        price: tp.price,
                        customerRoleId: tp.customerRoleId || ''
                    })));
                }

                // Set images
                if (fetchedProduct.multimedia.images && fetchedProduct.multimedia.images.length > 0) {
                    setImages(fetchedProduct.multimedia.images.map((img, index) => ({
                        id: index.toString(),
                        url: img.url,
                        altText: img.altText || '',
                        isPrimary: img.isPrimary,
                        sortOrder: img.sortOrder
                    })));
                }

                // Set related products
                if (fetchedProduct.relatedProducts && fetchedProduct.relatedProducts.length > 0) {
                    setRelatedProducts(fetchedProduct.relatedProducts);
                }

                // Set cross-sell products
                if (fetchedProduct.crossSellProducts && fetchedProduct.crossSellProducts.length > 0) {
                    setCrossSellProducts(fetchedProduct.crossSellProducts);
                }

                // Set selected discounts
                if (fetchedProduct.pricing?.discountIds) {
                    setSelectedDiscountIds(fetchedProduct.pricing.discountIds);
                }
            } else {
                setError('Product not found');
            }
        } catch (err) {
            console.error('Error loading product:', err);
            setError('Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            if (!product) return;

            // Construct updated product data
            const updatedProduct: Partial<Product> = {
                sku: formData.sku,
                slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                info: {
                    name: formData.name,
                    description: formData.description,
                    categories: formData.categories,
                    manufacturer: formData.manufacturer,
                    productTags: formData.productTags,
                    isPublished: formData.isPublished,
                    allowCustomerReviews: formData.allowCustomerReviews,
                    markAsNew: formData.markAsNew,
                    markAsNewStartDate: formData.markAsNewStartDate,
                    markAsNewEndDate: formData.markAsNewEndDate,
                },
                pricing: {
                    price: formData.price,
                    productCost: formData.productCost,
                    minBuy: formData.minBuy,
                    maxBuy: formData.maxBuy,
                    discountIds: selectedDiscountIds,
                    tierPrices: tierPrices.map(tp => ({
                        id: tp.id,
                        quantity: tp.quantity,
                        price: tp.price,
                        customerRoleId: tp.customerRoleId
                    }))
                },
                inventory: {
                    stockQuantity: formData.stockQuantity,
                    minimumStockQuantity: formData.minimumStockQuantity,
                    lowStockActivity: formData.lowStockActivity,
                    notifyForQtyBelow: formData.notifyForQtyBelow,
                    isNotReturnable: formData.isNotReturnable,
                    trackInventory: formData.trackInventory,
                },
                multimedia: {
                    images: images.map(img => ({
                        id: img.id,
                        url: img.url,
                        altText: img.altText,
                        isPrimary: img.isPrimary,
                        sortOrder: img.sortOrder
                    })),
                    videos: product.multimedia.videos || []
                },
                relatedProducts: relatedProducts,
                crossSellProducts: crossSellProducts,
                isActive: formData.isPublished,
            };

            await productService.update(productId, updatedProduct);
            alert('Product updated successfully!');
            router.push('/dashboard/products');
        } catch (err) {
            console.error('Error updating product:', err);
            alert('Failed to update product. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'info', label: 'Product Information', icon: Package },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'inventory', label: 'Inventory', icon: ShoppingCart },
        { id: 'multimedia', label: 'Multimedia', icon: ImageIcon },
        { id: 'related', label: 'Related Products', icon: LinkIcon },
        { id: 'crosssell', label: 'Cross-sells', icon: Users },
        { id: 'orders', label: 'Purchase History', icon: History },
        { id: 'stock-history', label: 'Stock History', icon: History },
    ];

    const addTierPrice = () => {
        const newTierPrice = {
            id: Date.now().toString(),
            quantity: 0,
            price: 0,
            customerRoleId: ''
        };
        setTierPrices([...tierPrices, newTierPrice]);
    };

    const removeTierPrice = (id: string) => {
        setTierPrices(tierPrices.filter(tp => tp.id !== id));
    };

    const addImage = () => {
        const newImage = {
            id: Date.now().toString(),
            url: '',
            altText: '',
            isPrimary: false,
            sortOrder: images.length + 1
        };
        setImages([...images, newImage]);
    };

    const removeImage = (id: string) => {
        setImages(images.filter(img => img.id !== id));
    };

    const addRelatedProduct = (productId: string) => {
        const product = availableProducts.find(p => p.id === productId);
        if (!product) return;

        // Check if already added
        if (relatedProducts.find(p => p.productId === productId)) {
            alert('This product is already added to related products');
            return;
        }

        const newRelatedProduct = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            imageUrl: product.image
        };
        setRelatedProducts([...relatedProducts, newRelatedProduct]);
        setRelatedProductSearch('');
    };

    const removeRelatedProduct = (productId: string) => {
        setRelatedProducts(relatedProducts.filter(p => p.productId !== productId));
    };

    const addCrossSellProduct = (productId: string) => {
        const product = availableProducts.find(p => p.id === productId);
        if (!product) return;

        // Check if already added
        if (crossSellProducts.find(p => p.productId === productId)) {
            alert('This product is already added to cross-sell products');
            return;
        }

        const newCrossSellProduct = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            imageUrl: product.image,
            sortOrder: crossSellProducts.length + 1
        };
        setCrossSellProducts([...crossSellProducts, newCrossSellProduct]);
        setCrossSellProductSearch('');
    };

    const removeCrossSellProduct = (productId: string) => {
        setCrossSellProducts(crossSellProducts.filter(p => p.productId !== productId));
    };

    // Discount management handlers
    const handleAddDiscount = (discountId: string) => {
        if (!selectedDiscountIds.includes(discountId)) {
            setSelectedDiscountIds([...selectedDiscountIds, discountId]);
        }
    };

    const handleRemoveDiscount = (discountId: string) => {
        setSelectedDiscountIds(selectedDiscountIds.filter(id => id !== discountId));
    };

    // Get discount details by ID
    const getDiscountById = (discountId: string) => {
        return availableDiscounts.find(d => d.id === discountId);
    };

    return (
        <DashboardLayout>
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold mb-2">Loading product...</h3>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2 text-red-600">Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link href="/dashboard/products">
                        <Button>Back to Products</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/products">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Products
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold">{formData.name || 'Product Details'}</h1>
                                <p className="text-gray-600">Manage all aspects of your product</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                Preview
                            </Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="grid gap-6">
                        {/* Product Information Tab */}
                        {activeTab === 'info' && (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Basic Information</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="form-group">
                                            <Label htmlFor="name" className="form-label">Product Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter product name"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="description" className="form-label">Description</Label>
                                            <textarea
                                                id="description"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={4}
                                                placeholder="Enter product description"
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="manufacturer" className="form-label">Manufacturer</Label>
                                            <Input
                                                id="manufacturer"
                                                placeholder="Enter manufacturer name"
                                                value={formData.manufacturer}
                                                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="categories" className="form-label">Categories</Label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.categories[0] || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value ? [e.target.value] : [] }))}
                                            >
                                                <option value="">Select categories</option>
                                                <option value="electronics">Electronics</option>
                                                <option value="clothing">Clothing</option>
                                                <option value="books">Books</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="tags" className="form-label">Product Tags</Label>
                                            <Input
                                                id="tags"
                                                placeholder="Enter tags separated by commas"
                                                value={formData.productTags.join(', ')}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    productTags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Publishing & Display</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="published"
                                                className="h-4 w-4 text-blue-600"
                                                checked={formData.isPublished}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                            />
                                            <Label htmlFor="published" className="form-label">Is Published</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="reviews"
                                                className="h-4 w-4 text-blue-600"
                                                checked={formData.allowCustomerReviews}
                                                onChange={(e) => setFormData(prev => ({ ...prev, allowCustomerReviews: e.target.checked }))}
                                            />
                                            <Label htmlFor="reviews" className="form-label">Allow Customer Reviews</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="markNew"
                                                className="h-4 w-4 text-blue-600"
                                                checked={formData.markAsNew}
                                                onChange={(e) => setFormData(prev => ({ ...prev, markAsNew: e.target.checked }))}
                                            />
                                            <Label htmlFor="markNew" className="form-label">Mark as New</Label>
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="newStartDate" className="form-label">Mark as New - Start Date</Label>
                                            <Input
                                                id="newStartDate"
                                                type="date"
                                                value={formData.markAsNewStartDate ? formData.markAsNewStartDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    markAsNewStartDate: e.target.value ? new Date(e.target.value) : undefined
                                                }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="newEndDate" className="form-label">Mark as New - End Date</Label>
                                            <Input
                                                id="newEndDate"
                                                type="date"
                                                value={formData.markAsNewEndDate ? formData.markAsNewEndDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    markAsNewEndDate: e.target.value ? new Date(e.target.value) : undefined
                                                }))}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Pricing Tab */}
                        {activeTab === 'pricing' && (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Basic Pricing</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="form-group">
                                            <Label htmlFor="price" className="form-label">Selling Price *</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="cost" className="form-label">Product Cost</Label>
                                            <Input
                                                id="cost"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.productCost}
                                                onChange={(e) => setFormData(prev => ({ ...prev, productCost: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="minBuy" className="form-label">Minimum Buy Quantity</Label>
                                            <Input
                                                id="minBuy"
                                                type="number"
                                                placeholder="1"
                                                value={formData.minBuy}
                                                onChange={(e) => setFormData(prev => ({ ...prev, minBuy: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="maxBuy" className="form-label">Maximum Buy Quantity</Label>
                                            <Input
                                                id="maxBuy"
                                                type="number"
                                                placeholder="100"
                                                value={formData.maxBuy}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxBuy: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <div className="flex items-center justify-between mb-2">
                                                <Label className="form-label">Discounts</Label>
                                                <Link href="/dashboard/discounts">
                                                    <Button type="button" variant="outline" size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create New Discount
                                                    </Button>
                                                </Link>
                                            </div>

                                            <DiscountSearchDropdown
                                                availableDiscounts={availableDiscounts}
                                                selectedDiscountId=""
                                                onSelect={handleAddDiscount}
                                                placeholder="Search and add discounts..."
                                                searchValue={discountSearchValue}
                                                onSearchChange={setDiscountSearchValue}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Search for discounts and click to add them to this product
                                            </p>

                                            {/* Display selected discounts */}
                                            {selectedDiscountIds.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-sm font-medium text-purple-800">
                                                        Applied Discounts ({selectedDiscountIds.length}):
                                                    </p>
                                                    <div className="space-y-2">
                                                        {selectedDiscountIds.map((discountId) => {
                                                            const discount = getDiscountById(discountId);
                                                            if (!discount) return null;

                                                            const isActive = discount.isActive &&
                                                                new Date(discount.startDate) <= new Date() &&
                                                                new Date(discount.endDate) >= new Date();

                                                            return (
                                                                <div
                                                                    key={discountId}
                                                                    className={`flex items-center gap-3 p-3 rounded-md border ${isActive
                                                                            ? 'bg-purple-50 border-purple-200'
                                                                            : 'bg-gray-50 border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                                                        {discount.type === 'percentage' ? (
                                                                            <span className="text-purple-600 font-semibold">
                                                                                {discount.value}%
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-purple-600 font-semibold text-xs">
                                                                                ₦{discount.value}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="font-medium text-sm text-purple-900">
                                                                                {discount.name}
                                                                            </div>
                                                                            {isActive ? (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                                    Active
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                                    Inactive
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-purple-700">
                                                                            {discount.type === 'percentage'
                                                                                ? `${discount.value}% off`
                                                                                : `₦${discount.value} off`}
                                                                            {discount.description && ` • ${discount.description}`}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveDiscount(discountId)}
                                                                        className="text-red-600 hover:text-red-800 p-1"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedDiscountIds.length === 0 && (
                                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-center text-sm text-gray-600">
                                                    No discounts applied yet. Search and add discounts above.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Tier Pricing
                                            <Button onClick={addTierPrice} variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Tier
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Tier pricing allows you to set different prices for higher quantities.
                                        </p>
                                        <div className="space-y-4">
                                            {tierPrices.map((tier) => (
                                                <div key={tier.id} className="flex items-center gap-2 p-3 border rounded-lg">
                                                    <div className="flex-1">
                                                        <Label className="text-xs">Quantity</Label>
                                                        <Input
                                                            type="number"
                                                            value={tier.quantity}
                                                            onChange={(e) => {
                                                                const updated = tierPrices.map(t =>
                                                                    t.id === tier.id ? { ...t, quantity: Number(e.target.value) } : t
                                                                );
                                                                setTierPrices(updated);
                                                            }}
                                                            placeholder="Min qty"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Label className="text-xs">Price</Label>
                                                        <Input
                                                            type="number"
                                                            value={tier.price}
                                                            onChange={(e) => {
                                                                const updated = tierPrices.map(t =>
                                                                    t.id === tier.id ? { ...t, price: Number(e.target.value) } : t
                                                                );
                                                                setTierPrices(updated);
                                                            }}
                                                            placeholder="Price"
                                                        />
                                                    </div>
                                                    <Button
                                                        onClick={() => removeTierPrice(tier.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Inventory Tab */}
                        {activeTab === 'inventory' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Inventory Management</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-6 lg:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="form-group">
                                            <Label htmlFor="stockQty" className="form-label">Stock Quantity *</Label>
                                            <Input
                                                id="stockQty"
                                                type="number"
                                                placeholder="0"
                                                value={formData.stockQuantity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="minStock" className="form-label">Minimum Stock Quantity</Label>
                                            <Input
                                                id="minStock"
                                                type="number"
                                                placeholder="5"
                                                value={formData.minimumStockQuantity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, minimumStockQuantity: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="notifyQty" className="form-label">Notify for Quantity Below</Label>
                                            <Input
                                                id="notifyQty"
                                                type="number"
                                                placeholder="10"
                                                value={formData.notifyForQtyBelow}
                                                onChange={(e) => setFormData(prev => ({ ...prev, notifyForQtyBelow: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="trackInventory"
                                                className="h-4 w-4 text-blue-600"
                                                checked={formData.trackInventory}
                                                onChange={(e) => setFormData(prev => ({ ...prev, trackInventory: e.target.checked }))}
                                            />
                                            <Label htmlFor="trackInventory" className="form-label">Track Inventory</Label>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="notReturnable"
                                                className="h-4 w-4 text-blue-600"
                                                checked={formData.isNotReturnable}
                                                onChange={(e) => setFormData(prev => ({ ...prev, isNotReturnable: e.target.checked }))}
                                            />
                                            <Label htmlFor="notReturnable" className="form-label">Is Not Returnable</Label>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="form-group">
                                            <Label className="form-label">Low Stock Activity</Label>
                                            <select
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.lowStockActivity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, lowStockActivity: e.target.value as 'disable' | 'unpublish' | 'notify' }))}
                                            >
                                                <option value="notify">Notify Only</option>
                                                <option value="disable">Disable Buy Button</option>
                                                <option value="unpublish">Unpublish Product</option>
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Multimedia Tab */}
                        {activeTab === 'multimedia' && (
                            <div className="grid gap-6 lg:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Product Images
                                            <Button onClick={addImage} variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Image
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {images.map((image, index) => (
                                                <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <Input placeholder="Image URL" value={image.url} />
                                                        <Input placeholder="Alt text" value={image.altText} />
                                                        <div className="flex items-center gap-2">
                                                            <input type="checkbox" checked={image.isPrimary} />
                                                            <Label className="text-sm">Primary Image</Label>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => removeImage(image.id)}
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600">Drag & drop images here or click to upload</p>
                                                <Button variant="outline" size="sm" className="mt-2">
                                                    Choose Files
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Product Videos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="form-group">
                                                <Label htmlFor="videoUrl" className="form-label">Video URL</Label>
                                                <Input id="videoUrl" placeholder="https://youtube.com/watch?v=..." />
                                            </div>

                                            <div className="form-group">
                                                <Label htmlFor="videoTitle" className="form-label">Video Title</Label>
                                                <Input id="videoTitle" placeholder="Product demo video" />
                                            </div>

                                            <div className="form-group">
                                                <Label htmlFor="videoDesc" className="form-label">Video Description</Label>
                                                <textarea
                                                    id="videoDesc"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={3}
                                                    placeholder="Describe the video content"
                                                />
                                            </div>

                                            <Button variant="outline">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Video
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Related Products Tab */}
                        {activeTab === 'related' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Related Products</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Related products are displayed on the product details page to advertise products
                                        that are not part of the selected category.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="form-label">Search and Add Product</Label>
                                            <ProductSearchDropdown
                                                availableProducts={availableProducts}
                                                selectedProductId=""
                                                onSelect={addRelatedProduct}
                                                placeholder="Search for a product to add..."
                                                searchValue={relatedProductSearch}
                                                onSearchChange={setRelatedProductSearch}
                                                defaultProductImage={defaultProductImage}
                                            />
                                        </div>

                                        {relatedProducts.length > 0 ? (
                                            <div className="space-y-3">
                                                {relatedProducts.map((product) => (
                                                    <div
                                                        key={product.productId}
                                                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                                                    >
                                                        <img
                                                            src={product.imageUrl || defaultProductImage}
                                                            alt={product.productName}
                                                            className="w-16 h-16 object-cover rounded"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = defaultProductImage;
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{product.productName}</h4>
                                                            <p className="text-sm text-gray-600">${product.price}</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeRelatedProduct(product.productId)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                                No related products added yet
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Cross-sells Tab */}
                        {activeTab === 'crosssell' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Cross-sell Products</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Cross-sell products are additional products that generally go with the selected product.
                                        They are displayed at the bottom of the checkout page.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="form-label">Search and Add Product</Label>
                                            <ProductSearchDropdown
                                                availableProducts={availableProducts}
                                                selectedProductId=""
                                                onSelect={addCrossSellProduct}
                                                placeholder="Search for a product to add..."
                                                searchValue={crossSellProductSearch}
                                                onSearchChange={setCrossSellProductSearch}
                                                defaultProductImage={defaultProductImage}
                                            />
                                        </div>

                                        {crossSellProducts.length > 0 ? (
                                            <div className="space-y-3">
                                                {crossSellProducts.map((product) => (
                                                    <div
                                                        key={product.productId}
                                                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                                                    >
                                                        <img
                                                            src={product.imageUrl || defaultProductImage}
                                                            alt={product.productName}
                                                            className="w-16 h-16 object-cover rounded"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = defaultProductImage;
                                                            }}
                                                        />
                                                        <div className="flex-1">
                                                            <h4 className="font-medium">{product.productName}</h4>
                                                            <p className="text-sm text-gray-600">${product.price}</p>
                                                            <p className="text-xs text-gray-500">Sort Order: {product.sortOrder}</p>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeCrossSellProduct(product.productId)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                                                No cross-sell products added yet
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Purchase History Tab */}
                        {activeTab === 'orders' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Purchased with Orders</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Here you can see a list of orders in which this product was purchased.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="table-header">Order ID</th>
                                                    <th className="table-header">Date</th>
                                                    <th className="table-header">Customer</th>
                                                    <th className="table-header">Quantity</th>
                                                    <th className="table-header">Unit Price</th>
                                                    <th className="table-header">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="table-cell" colSpan={6}>
                                                        <div className="text-center py-8 text-gray-500">
                                                            No purchase history available
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stock History Tab */}
                        {activeTab === 'stock-history' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Stock Quantity History</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Here you can see a history of the product stock quantity changes.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="table-header">Date</th>
                                                    <th className="table-header">Previous Qty</th>
                                                    <th className="table-header">New Qty</th>
                                                    <th className="table-header">Change</th>
                                                    <th className="table-header">Reason</th>
                                                    <th className="table-header">Notes</th>
                                                    <th className="table-header">User</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td className="table-cell" colSpan={7}>
                                                        <div className="text-center py-8 text-gray-500">
                                                            No stock history available
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}