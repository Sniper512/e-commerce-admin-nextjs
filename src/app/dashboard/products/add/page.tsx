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
    ShoppingCart,
    Package,
    DollarSign,
    Image as ImageIcon,
    Link as LinkIcon,
    Users,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { ProductSearchDropdown } from '@/components/ui/product-search-dropdown';

export default function AddProductPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('info');
    const [loading, setLoading] = useState(false);
    const [availableProductsFromDB, setAvailableProductsFromDB] = useState<Product[]>([]);

    // Form state for product information
    const [formData, setFormData] = useState({
        // Product Information
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

        // Pricing
        price: 0,
        productCost: 0,
        minBuy: 1,
        maxBuy: 999,

        // Inventory
        stockQuantity: 0,
        minimumStockQuantity: 10,
        lowStockActivity: 'notify' as 'disable' | 'unpublish' | 'notify',
        notifyForQtyBelow: 5,
        isNotReturnable: false,
        trackInventory: true,
    });

    const [productType, setProductType] = useState<'single' | 'composite'>('single');
    const [tierPrices, setTierPrices] = useState([
        { id: '1', quantity: 10, price: 90, customerRoleId: '' }
    ]);
    const [images, setImages] = useState([
        { id: '1', url: '', altText: '', isPrimary: true, sortOrder: 1 }
    ]);
    const [videos, setVideos] = useState<Array<{ id: string, url: string, title: string, description: string, sortOrder: number }>>([]);
    const [compositeItems, setCompositeItems] = useState<Array<{ productId: string, quantity: number }>>([]);
    const [relatedProducts, setRelatedProducts] = useState<Array<{ productId: string, productName: string, price: number, imageUrl?: string }>>([]);
    const [crossSellProducts, setCrossSellProducts] = useState<Array<{ productId: string, productName: string, price: number, imageUrl?: string, sortOrder: number }>>([]);
    const [hasBatches, setHasBatches] = useState(false);
    const [relatedProductSearch, setRelatedProductSearch] = useState('');
    const [crossSellProductSearch, setCrossSellProductSearch] = useState('');

    // Default product image
    const defaultProductImage = '/images/default-product.svg';

    const tabs = [
        { id: 'info', label: 'Product Information', icon: Package },
        { id: 'pricing', label: 'Pricing', icon: DollarSign },
        { id: 'inventory', label: 'Inventory', icon: ShoppingCart },
        { id: 'multimedia', label: 'Multimedia', icon: ImageIcon },
        { id: 'related', label: 'Related Products', icon: LinkIcon },
        { id: 'crosssell', label: 'Cross-sells', icon: Users },
    ];

    // Load available products on component mount
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await productService.getAll({ isActive: true });
                setAvailableProductsFromDB(products);
            } catch (error) {
                console.error('Error loading products:', error);
            }
        };
        loadProducts();
    }, []);

    // Use Firebase products - memoized to prevent re-computation on every render
    const availableProducts = useMemo(() => {
        if (availableProductsFromDB.length > 0) {
            return availableProductsFromDB.map(p => ({
                id: p.id,
                name: p.info.name,
                sku: p.sku,
                price: p.pricing.price,
                image: p.multimedia.images[0]?.url || defaultProductImage
            }));
        }
        // Fallback to mock data if no products in DB yet
        return [
            { id: '1', name: 'Cooking Oil 5L', sku: 'PRD-001', price: 2500, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&h=200&fit=crop' },
            { id: '2', name: 'Basmati Rice 10kg', sku: 'PRD-002', price: 1800, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop' },
            { id: '3', name: 'Detergent Powder 1kg', sku: 'PRD-003', price: 450, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop' },
            { id: '4', name: 'Premium Tea Pack', sku: 'PRD-004', price: 350, image: 'https://images.unsplash.com/photo-1564890273-8ac5ba04b572?w=200&h=200&fit=crop' },
            { id: '5', name: 'Organic Honey 500g', sku: 'PRD-005', price: 650, image: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=200&h=200&fit=crop' },
            { id: '6', name: 'Wheat Flour 5kg', sku: 'PRD-006', price: 320, image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&h=200&fit=crop' },
            { id: '7', name: 'Coconut Oil 1L', sku: 'PRD-007', price: 480, image: 'https://images.unsplash.com/photo-1520950237263-4085a96c8a88?w=200&h=200&fit=crop' },
            { id: '8', name: 'Brown Sugar 1kg', sku: 'PRD-008', price: 120, image: 'https://images.unsplash.com/photo-1624006442071-32e8b0e7bbed?w=200&h=200&fit=crop' },
        ];
    }, [availableProductsFromDB]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Construct the product object according to the Product interface
            const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                sku: formData.sku,
                type: productType,

                // Product Information Section
                info: {
                    name: formData.name,
                    description: formData.description,
                    categories: formData.categories,
                    manufacturer: formData.manufacturer,
                    isPublished: formData.isPublished,
                    productTags: formData.productTags,
                    allowCustomerReviews: formData.allowCustomerReviews,
                    markAsNew: formData.markAsNew,
                    markAsNewStartDate: formData.markAsNewStartDate,
                    markAsNewEndDate: formData.markAsNewEndDate,
                },

                // Pricing Section
                pricing: {
                    price: formData.price,
                    productCost: formData.productCost,
                    discountIds: [],
                    minBuy: formData.minBuy,
                    maxBuy: formData.maxBuy,
                    tierPrices: tierPrices.map(tp => ({
                        id: tp.id,
                        quantity: tp.quantity,
                        price: tp.price,
                        customerRoleId: tp.customerRoleId || undefined,
                    })),
                },

                // Inventory Section
                inventory: {
                    stockQuantity: formData.stockQuantity,
                    minimumStockQuantity: formData.minimumStockQuantity,
                    lowStockActivity: formData.lowStockActivity,
                    notifyForQtyBelow: formData.notifyForQtyBelow,
                    isNotReturnable: formData.isNotReturnable,
                    trackInventory: formData.trackInventory,
                },

                // Multimedia Section
                multimedia: {
                    images: images.map(img => ({
                        id: img.id,
                        url: img.url,
                        altText: img.altText,
                        isPrimary: img.isPrimary,
                        sortOrder: img.sortOrder,
                    })),
                    videos: videos.map(vid => ({
                        id: vid.id,
                        url: vid.url,
                        title: vid.title,
                        description: vid.description || '',
                        sortOrder: vid.sortOrder,
                    })),
                },

                // Related Products Section
                relatedProducts: relatedProducts.map(rp => ({
                    productId: rp.productId,
                    productName: rp.productName,
                    price: rp.price,
                    imageUrl: rp.imageUrl,
                })),

                // Cross-sells Section
                crossSellProducts: crossSellProducts.map(csp => ({
                    productId: csp.productId,
                    productName: csp.productName,
                    price: csp.price,
                    imageUrl: csp.imageUrl,
                    sortOrder: csp.sortOrder,
                })),

                // Purchase History Section (empty for new products)
                purchaseHistory: [],

                // Stock History Section (initial entry)
                stockHistory: [{
                    id: Date.now().toString(),
                    date: new Date(),
                    previousQuantity: 0,
                    newQuantity: formData.stockQuantity,
                    changeReason: 'restock',
                    notes: 'Initial stock',
                    userId: 'admin', // TODO: Get from auth context
                }],

                // Legacy fields for backwards compatibility
                categoryIds: formData.categories,
                images: images.map(img => img.url),
                thumbnailUrl: images.find(img => img.isPrimary)?.url,
                minStockLevel: formData.minimumStockQuantity,
                basePrice: formData.productCost,
                sellingPrice: formData.price,
                discount: 0,

                // Composite product details
                compositeItems: productType === 'composite' ? compositeItems : undefined,

                // Batch tracking
                hasBatches: false, // TODO: Implement batch tracking UI

                // Display
                displayOrder: 0, // TODO: Calculate next display order
                isFeatured: false,
                isActive: formData.isPublished,

                // Metadata
                tags: formData.productTags,
                createdBy: 'admin', // TODO: Get from auth context
                updatedBy: 'admin', // TODO: Get from auth context
            };

            // Save to Firebase
            const productId = await productService.create(productData);

            alert(`Product created successfully with ID: ${productId}`);
            router.push('/dashboard/products');

        } catch (error) {
            console.error('Error creating product:', error);
            alert('Error creating product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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

    const addVideo = () => {
        const newVideo = {
            id: Date.now().toString(),
            url: '',
            title: '',
            description: '',
            sortOrder: videos.length + 1
        };
        setVideos([...videos, newVideo]);
    };

    const removeVideo = (id: string) => {
        setVideos(videos.filter(vid => vid.id !== id));
    };

    const addRelatedProduct = () => {
        const newRelatedProduct = {
            productId: '',
            productName: '',
            price: 0,
            imageUrl: ''
        };
        setRelatedProducts([...relatedProducts, newRelatedProduct]);
    };

    const removeRelatedProduct = (index: number) => {
        setRelatedProducts(relatedProducts.filter((_, i) => i !== index));
    };

    const selectRelatedProduct = (index: number, productId: string) => {
        const selectedProduct = availableProducts.find(p => p.id === productId);
        if (selectedProduct) {
            const updated = relatedProducts.map((item, i) =>
                i === index ? {
                    ...item,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    price: selectedProduct.price,
                    imageUrl: selectedProduct.image
                } : item
            );
            setRelatedProducts(updated);
        }
    };

    const addCrossSellProduct = () => {
        const newCrossSellProduct = {
            productId: '',
            productName: '',
            price: 0,
            imageUrl: '',
            sortOrder: crossSellProducts.length + 1
        };
        setCrossSellProducts([...crossSellProducts, newCrossSellProduct]);
    };

    const removeCrossSellProduct = (index: number) => {
        setCrossSellProducts(crossSellProducts.filter((_, i) => i !== index));
    };

    const selectCrossSellProduct = (index: number, productId: string) => {
        const selectedProduct = availableProducts.find(p => p.id === productId);
        if (selectedProduct) {
            const updated = crossSellProducts.map((item, i) =>
                i === index ? {
                    ...item,
                    productId: selectedProduct.id,
                    productName: selectedProduct.name,
                    price: selectedProduct.price,
                    imageUrl: selectedProduct.image
                } : item
            );
            setCrossSellProducts(updated);
        }
    };

    const addCompositeItem = () => {
        setCompositeItems([...compositeItems, { productId: '', quantity: 1 }]);
    };

    const removeCompositeItem = (index: number) => {
        setCompositeItems(compositeItems.filter((_, i) => i !== index));
    };

    return (
        <DashboardLayout>
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
                            <h1 className="text-3xl font-bold">Add New Product</h1>
                            <p className="text-gray-600">Create a new product in your inventory</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline">
                            Save as Draft
                        </Button>
                        <Button onClick={handleSubmit}>
                            <Save className="h-4 w-4 mr-2" />
                            Create Product
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

                <form onSubmit={handleSubmit}>
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
                                                name="name"
                                                placeholder="Enter product name"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="sku" className="form-label">SKU *</Label>
                                            <Input
                                                id="sku"
                                                name="sku"
                                                placeholder="Enter product SKU"
                                                value={formData.sku}
                                                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="description" className="form-label">Description</Label>
                                            <textarea
                                                id="description"
                                                name="description"
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
                                                name="manufacturer"
                                                placeholder="Enter manufacturer name"
                                                value={formData.manufacturer}
                                                onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="productType" className="form-label">Product Type</Label>
                                            <select
                                                id="productType"
                                                name="productType"
                                                value={productType}
                                                onChange={(e) => setProductType(e.target.value as 'single' | 'composite')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="single">Single Product</option>
                                                <option value="composite">Composite Product</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="categories" className="form-label">Categories</Label>
                                            <select
                                                id="categories"
                                                name="categories"
                                                value={formData.categories[0] || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        categories: value ? [value] : []
                                                    }));
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Select categories</option>
                                                <option value="electronics">Electronics</option>
                                                <option value="clothing">Clothing</option>
                                                <option value="books">Books</option>
                                                <option value="home">Home & Garden</option>
                                                <option value="sports">Sports & Outdoors</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="tags" className="form-label">Product Tags</Label>
                                            <Input
                                                id="tags"
                                                name="tags"
                                                placeholder="Enter tags separated by commas"
                                                value={formData.productTags.join(', ')}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    productTags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                                                }))}
                                            />
                                        </div>

                                        {productType === 'composite' && (
                                            <div className="form-group">
                                                <Label className="form-label">Composite Items</Label>
                                                <div className="space-y-2">
                                                    {compositeItems.map((item, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md">
                                                                <option value="">Select Product</option>
                                                                <option value="prod1">Product 1</option>
                                                                <option value="prod2">Product 2</option>
                                                            </select>
                                                            <Input
                                                                type="number"
                                                                placeholder="Qty"
                                                                className="w-20"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...compositeItems];
                                                                    updated[index].quantity = Number(e.target.value);
                                                                    setCompositeItems(updated);
                                                                }}
                                                            />
                                                            <Button
                                                                type="button"
                                                                onClick={() => removeCompositeItem(index)}
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        onClick={addCompositeItem}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Item
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
                                                name="published"
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
                                                name="reviews"
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
                                                name="markNew"
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
                                                name="newStartDate"
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
                                                name="newEndDate"
                                                type="date"
                                                value={formData.markAsNewEndDate ? formData.markAsNewEndDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    markAsNewEndDate: e.target.value ? new Date(e.target.value) : undefined
                                                }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="displayOrder" className="form-label">Display Order</Label>
                                            <Input id="displayOrder" name="displayOrder" type="number" placeholder="0" />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="hasBatches"
                                                name="hasBatches"
                                                checked={hasBatches}
                                                onChange={(e) => setHasBatches(e.target.checked)}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <Label htmlFor="hasBatches" className="form-label">Has Batches (Expiry Tracking)</Label>
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
                                                name="price"
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="cost" className="form-label">Product Cost</Label>
                                            <Input
                                                id="cost"
                                                name="cost"
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
                                                name="minBuy"
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
                                                name="maxBuy"
                                                type="number"
                                                placeholder="100"
                                                value={formData.maxBuy}
                                                onChange={(e) => setFormData(prev => ({ ...prev, maxBuy: Number(e.target.value) }))}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label className="form-label">Discounts</Label>
                                            <Link href="/dashboard/discounts">
                                                <Button type="button" variant="outline" size="sm">
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Manage Discounts
                                                </Button>
                                            </Link>
                                            <p className="text-sm text-gray-600">Create discounts on separate discount management page</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Tier Pricing
                                            <Button onClick={addTierPrice} type="button" variant="outline" size="sm">
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
                                                            step="0.01"
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
                                                        type="button"
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
                                                name="stockQty"
                                                type="number"
                                                placeholder="0"
                                                value={formData.stockQuantity}
                                                onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <Label htmlFor="minStock" className="form-label">Minimum Stock Quantity</Label>
                                            <Input
                                                id="minStock"
                                                name="minStock"
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
                                                name="notifyQty"
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
                                                name="trackInventory"
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
                                                name="notReturnable"
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
                                                name="lowStockActivity"
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
                                            <Button onClick={addImage} type="button" variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Image
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {images.map((image) => (
                                                <div key={image.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <Input
                                                            placeholder="Image URL"
                                                            value={image.url}
                                                            onChange={(e) => {
                                                                const updated = images.map(img =>
                                                                    img.id === image.id ? { ...img, url: e.target.value } : img
                                                                );
                                                                setImages(updated);
                                                            }}
                                                        />
                                                        <Input
                                                            placeholder="Alt text"
                                                            value={image.altText}
                                                            onChange={(e) => {
                                                                const updated = images.map(img =>
                                                                    img.id === image.id ? { ...img, altText: e.target.value } : img
                                                                );
                                                                setImages(updated);
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={image.isPrimary}
                                                                onChange={(e) => {
                                                                    const updated = images.map(img =>
                                                                        img.id === image.id
                                                                            ? { ...img, isPrimary: e.target.checked }
                                                                            : { ...img, isPrimary: false } // Only one primary image
                                                                    );
                                                                    setImages(updated);
                                                                }}
                                                            />
                                                            <Label className="text-sm">Primary Image</Label>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => removeImage(image.id)}
                                                        type="button"
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
                                                <Button type="button" variant="outline" size="sm" className="mt-2">
                                                    Choose Files
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Product Videos
                                            <Button onClick={addVideo} type="button" variant="outline" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Video
                                            </Button>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {videos.map((video) => (
                                                <div key={video.id} className="p-3 border rounded-lg space-y-2">
                                                    <div className="form-group">
                                                        <Label className="text-sm">Video URL</Label>
                                                        <Input
                                                            placeholder="https://youtube.com/watch?v=..."
                                                            value={video.url}
                                                            onChange={(e) => {
                                                                const updated = videos.map(vid =>
                                                                    vid.id === video.id ? { ...vid, url: e.target.value } : vid
                                                                );
                                                                setVideos(updated);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <Label className="text-sm">Video Title</Label>
                                                        <Input
                                                            placeholder="Product demo video"
                                                            value={video.title}
                                                            onChange={(e) => {
                                                                const updated = videos.map(vid =>
                                                                    vid.id === video.id ? { ...vid, title: e.target.value } : vid
                                                                );
                                                                setVideos(updated);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <Label className="text-sm">Video Description</Label>
                                                        <textarea
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows={3}
                                                            placeholder="Describe the video content"
                                                            value={video.description}
                                                            onChange={(e) => {
                                                                const updated = videos.map(vid =>
                                                                    vid.id === video.id ? { ...vid, description: e.target.value } : vid
                                                                );
                                                                setVideos(updated);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex justify-end">
                                                        <Button
                                                            onClick={() => removeVideo(video.id)}
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {videos.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    No videos added yet. Click "Add Video" to get started.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Related Products Tab */}
                        {activeTab === 'related' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        Related Products
                                        <Button onClick={addRelatedProduct} type="button" variant="outline" size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Related Product
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {relatedProducts.map((relatedProduct, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                                        <img
                                                            src={relatedProduct.imageUrl || defaultProductImage}
                                                            alt={relatedProduct.productName || 'Product'}
                                                            className="w-16 h-16 object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = defaultProductImage;
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-medium">Select Product</Label>
                                                        <ProductSearchDropdown
                                                            availableProducts={availableProducts}
                                                            selectedProductId={relatedProduct.productId}
                                                            onSelect={(productId) => selectRelatedProduct(index, productId)}
                                                            searchValue={relatedProductSearch}
                                                            onSearchChange={setRelatedProductSearch}
                                                            defaultProductImage={defaultProductImage}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">Product Details</Label>
                                                        <div className="p-2 bg-gray-50 rounded border">
                                                            <div className="text-sm">
                                                                <div><strong>Name:</strong> {relatedProduct.productName || 'Not selected'}</div>
                                                                <div><strong>Price:</strong> ${relatedProduct.price || 0}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => removeRelatedProduct(index)}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {relatedProducts.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                No related products added yet. Click "Add Related Product" to get started.
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
                                    <CardTitle className="flex items-center justify-between">
                                        Cross-sell Products
                                        <Button onClick={addCrossSellProduct} type="button" variant="outline" size="sm">
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Cross-sell Product
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {crossSellProducts.map((crossSellProduct, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                                        <img
                                                            src={crossSellProduct.imageUrl || defaultProductImage}
                                                            alt={crossSellProduct.productName || 'Product'}
                                                            className="w-16 h-16 object-cover"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.src = defaultProductImage;
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <Label className="text-sm font-medium">Select Product</Label>
                                                        <ProductSearchDropdown
                                                            availableProducts={availableProducts}
                                                            selectedProductId={crossSellProduct.productId}
                                                            onSelect={(productId) => selectCrossSellProduct(index, productId)}
                                                            searchValue={crossSellProductSearch}
                                                            onSearchChange={setCrossSellProductSearch}
                                                            defaultProductImage={defaultProductImage}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">Product Details</Label>
                                                        <div className="p-2 bg-gray-50 rounded border">
                                                            <div className="text-sm">
                                                                <div><strong>Name:</strong> {crossSellProduct.productName || 'Not selected'}</div>
                                                                <div><strong>Price:</strong> ${crossSellProduct.price || 0}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-medium">Sort Order</Label>
                                                        <Input
                                                            type="number"
                                                            placeholder="1"
                                                            value={crossSellProduct.sortOrder}
                                                            onChange={(e) => {
                                                                const updated = crossSellProducts.map((item, i) =>
                                                                    i === index ? { ...item, sortOrder: parseInt(e.target.value) || 0 } : item
                                                                );
                                                                setCrossSellProducts(updated);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => removeCrossSellProduct(index)}
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {crossSellProducts.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                No cross-sell products added yet. Click "Add Cross-sell Product" to get started.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}