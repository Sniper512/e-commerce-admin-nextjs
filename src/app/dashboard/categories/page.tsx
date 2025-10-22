'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    ArrowUpDown,
    Image as ImageIcon,
    Folder,
    FolderOpen,
    BarChart3,
    Settings,
    Upload,
    X,
    Save,
    Loader2
} from 'lucide-react';
import { Category, Product } from '@/types';
import { productService } from '@/services/productService';
import CategoryService from '@/services/categoryService';

// Default images
const DEFAULT_CATEGORY_IMAGE = '/images/default-category.svg';
const DEFAULT_PRODUCT_IMAGE = '/images/default-product.svg';

export default function CategoriesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [availableProducts, setAvailableProducts] = React.useState<Product[]>([]);
    const [editingCategoryId, setEditingCategoryId] = React.useState<string | null>(null);
    const [viewingCategory, setViewingCategory] = React.useState<Category | null>(null);
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        type: 'simple' as 'simple' | 'special',
        parentId: '',
        picture: '',
        displayOrder: 1,
        isPublished: true,
        showOnHomepage: false,
        showOnNavbar: true,
        selectedProductIds: [] as string[]
    });

    // Load available products when modal opens
    React.useEffect(() => {
        if (showAddModal) {
            loadProducts();
        }
    }, [showAddModal]);

    // Load categories on component mount
    React.useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const fetchedCategories = await CategoryService.getAllCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const loadProducts = async () => {
        try {
            const products = await productService.getAll({ isActive: true });
            setAvailableProducts(products);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleViewCategory = (categoryId: string) => {
        router.push(`/dashboard/categories/${categoryId}`);
    };

    const handleEditCategory = (categoryId: string) => {
        router.push(`/dashboard/categories/${categoryId}`);
    };

    const handleSaveCategory = async () => {
        if (!formData.name.trim()) {
            alert('Please enter a category name');
            return;
        }

        try {
            setLoading(true);

            const categoryData = {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                parentId: formData.parentId || undefined,
                picture: formData.picture,
                displayOrder: formData.displayOrder,
                isPublished: formData.isPublished,
                showOnHomepage: formData.showOnHomepage,
                showOnNavbar: formData.showOnNavbar,
                productIds: formData.selectedProductIds
            };

            if (editingCategoryId) {
                // Update existing category
                await CategoryService.updateCategory(editingCategoryId, categoryData);
                alert('Category updated successfully!');
            } else {
                // Create new category
                await CategoryService.createCategory(categoryData);
                alert('Category created successfully!');
            }

            // Reload categories
            await loadCategories();

            // Reset form and close modal
            setFormData({
                name: '',
                description: '',
                type: 'simple',
                parentId: '',
                picture: '',
                displayOrder: 1,
                isPublished: true,
                showOnHomepage: false,
                showOnNavbar: true,
                selectedProductIds: []
            });
            setEditingCategoryId(null);
            setShowAddModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingCategoryId(null);
        setFormData({
            name: '',
            description: '',
            type: 'simple',
            parentId: '',
            picture: '',
            displayOrder: 1,
            isPublished: true,
            showOnHomepage: false,
            showOnNavbar: true,
            selectedProductIds: []
        });
    };

    const toggleProductSelection = (productId: string) => {
        setFormData(prev => ({
            ...prev,
            selectedProductIds: prev.selectedProductIds.includes(productId)
                ? prev.selectedProductIds.filter(id => id !== productId)
                : [...prev.selectedProductIds, productId]
        }));
    };

    const filteredCategories = categories.filter((cat: Category) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Categories</h1>
                        <p className="text-gray-600">Organize your products into categories</p>
                    </div>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                placeholder="Search categories..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Categories Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <button className="flex items-center gap-1 font-semibold">
                                            Display Order
                                            <ArrowUpDown className="h-4 w-4" />
                                        </button>
                                    </TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead className="text-center">Navbar</TableHead>
                                    <TableHead className="text-center">Homepage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCategories.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell className="font-medium">{category.displayOrder}</TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={category.type === 'special' ? 'default' : 'secondary'}>
                                                {category.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{category.productCount || category.productIds.length}</TableCell>
                                        <TableCell className="text-center">
                                            {category.showOnNavbar ? (
                                                <Badge variant="success">✓</Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {category.showOnHomepage ? (
                                                <Badge variant="success">✓</Badge>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={category.isActive ? 'success' : 'secondary'}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewCategory(category.id)}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditCategory(category.id)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button variant="outline" size="sm">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Enhanced Add/Edit Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-gray-800">
                                            {editingCategoryId ? 'Edit Category' : 'Add New Category'}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {editingCategoryId
                                                ? 'Update category details'
                                                : 'Create a new category to organize your products'}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCloseModal}
                                        className="h-8 w-8 p-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0 overflow-y-auto max-h-[calc(95vh-120px)]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                    {/* Left Column - Category Details */}
                                    <div className="p-6 space-y-6 border-r border-gray-200">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <Settings className="h-5 w-5" />
                                                Category Details
                                            </h3>

                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                        Category Name *
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        placeholder="Enter category name"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                                                        Description
                                                    </Label>
                                                    <Textarea
                                                        id="description"
                                                        value={formData.description}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Category description"
                                                        rows={3}
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                                                            Category Type
                                                        </Label>
                                                        <select
                                                            value={formData.type}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'simple' | 'special' }))}
                                                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="simple">Simple</option>
                                                            <option value="special">Special</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="displayOrder" className="text-sm font-medium text-gray-700">
                                                            Display Order
                                                        </Label>
                                                        <Input
                                                            id="displayOrder"
                                                            type="number"
                                                            value={formData.displayOrder}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                                                            min="1"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label htmlFor="parentId" className="text-sm font-medium text-gray-700">
                                                        Parent Category
                                                    </Label>
                                                    <select
                                                        value={formData.parentId}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">None (Root Category)</option>
                                                        {categories.filter(cat => !cat.parentId).map(cat => (
                                                            <option key={cat.id} value={cat.id}>
                                                                {cat.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <Label htmlFor="picture" className="text-sm font-medium text-gray-700">
                                                        Picture URL
                                                    </Label>
                                                    <div className="flex gap-2 mt-1">
                                                        <Input
                                                            id="picture"
                                                            value={formData.picture}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
                                                            placeholder="Image URL"
                                                            className="flex-1"
                                                        />
                                                        <Button variant="outline" size="sm" title="Upload image">
                                                            <Upload className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="mt-3">
                                                        <img
                                                            src={formData.picture || DEFAULT_CATEGORY_IMAGE}
                                                            alt="Category preview"
                                                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                                                            onError={(e) => {
                                                                e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                                                        Publication Settings
                                                    </Label>
                                                    <div className="space-y-3">
                                                        <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.isPublished}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <span className="font-medium">Published</span>
                                                                <p className="text-sm text-gray-500">Make this category visible to customers</p>
                                                            </div>
                                                        </label>

                                                        <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.showOnHomepage}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <span className="font-medium">Show on Homepage</span>
                                                                <p className="text-sm text-gray-500">Display on homepage</p>
                                                            </div>
                                                        </label>

                                                        <label className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.showOnNavbar}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, showOnNavbar: e.target.checked }))}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                            />
                                                            <div>
                                                                <span className="font-medium">Show on Navbar</span>
                                                                <p className="text-sm text-gray-500">Include in navigation menu</p>
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Product Selection */}
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Assign Products ({formData.selectedProductIds.length} selected)
                                            </h3>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon className="h-5 w-5 text-blue-600" />
                                                    <div>
                                                        <p className="font-medium text-blue-800">Product Assignment</p>
                                                        <p className="text-sm text-blue-600">
                                                            Select products to include in this category. Products can belong to multiple categories.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                                                {availableProducts.length === 0 ? (
                                                    <div className="p-6 text-center text-gray-500">
                                                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                                        <p>No products available</p>
                                                        <p className="text-sm">Create products first to assign them to categories</p>
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-gray-200">
                                                        {availableProducts.map((product) => (
                                                            <label
                                                                key={product.id}
                                                                className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formData.selectedProductIds.includes(product.id)}
                                                                    onChange={() => toggleProductSelection(product.id)}
                                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3">
                                                                        <img
                                                                            src={(product.images && product.images.length > 0) ? product.images[0] : DEFAULT_PRODUCT_IMAGE}
                                                                            alt={product.info?.name || 'Product'}
                                                                            className="w-12 h-12 object-cover rounded border"
                                                                            onError={(e) => {
                                                                                e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                                                            }}
                                                                        />
                                                                        <div className="flex-1">
                                                                            <p className="font-medium text-gray-900">
                                                                                {product.info?.name || 'Unnamed Product'}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">
                                                                                SKU: {product.sku} • ${product.pricing?.price || 0}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="border-t bg-gray-50 px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600">
                                            {formData.selectedProductIds.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <BarChart3 className="h-4 w-4" />
                                                    {formData.selectedProductIds.length} product(s) selected
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                onClick={handleCloseModal}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleSaveCategory}
                                                disabled={loading || !formData.name.trim()}
                                                className="min-w-[140px]"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        {editingCategoryId ? 'Updating...' : 'Creating...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        {editingCategoryId ? 'Update Category' : 'Create Category'}
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* View Category Modal */}
                {showViewModal && viewingCategory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <CardHeader className="border-b bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-2xl font-bold text-gray-800">
                                        Category Details
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowViewModal(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Category Image */}
                                <div className="flex justify-center">
                                    <img
                                        src={viewingCategory.picture || DEFAULT_CATEGORY_IMAGE}
                                        alt={viewingCategory.name}
                                        className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                                        onError={(e) => {
                                            e.currentTarget.src = DEFAULT_CATEGORY_IMAGE;
                                        }}
                                    />
                                </div>

                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold text-gray-700">Category Name</Label>
                                        <p className="mt-1 text-lg font-medium">{viewingCategory.name}</p>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-semibold text-gray-700">Slug</Label>
                                        <p className="mt-1 text-gray-600">{viewingCategory.slug}</p>
                                    </div>

                                    {viewingCategory.description && (
                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Description</Label>
                                            <p className="mt-1 text-gray-600">{viewingCategory.description}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Type</Label>
                                            <Badge variant="default" className="mt-1">
                                                {viewingCategory.type}
                                            </Badge>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Display Order</Label>
                                            <p className="mt-1 text-gray-600">{viewingCategory.displayOrder}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Status</Label>
                                            <div className="mt-1">
                                                <Badge variant={viewingCategory.isPublished ? 'success' : 'secondary'}>
                                                    {viewingCategory.isPublished ? 'Published' : 'Unpublished'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Products</Label>
                                            <p className="mt-1 text-gray-600">{viewingCategory.productIds.length} product(s)</p>
                                        </div>
                                    </div>

                                    {/* Display Options */}
                                    <div>
                                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">Display Options</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {viewingCategory.showOnNavbar && (
                                                <Badge variant="default" className="bg-blue-50">
                                                    Show on Navbar
                                                </Badge>
                                            )}
                                            {viewingCategory.showOnHomepage && (
                                                <Badge variant="success" className="bg-green-50">
                                                    Show on Homepage
                                                </Badge>
                                            )}
                                            {!viewingCategory.showOnNavbar && !viewingCategory.showOnHomepage && (
                                                <Badge variant="secondary">
                                                    Not displayed
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Parent Category */}
                                    {viewingCategory.parentId && (
                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700">Parent Category</Label>
                                            <p className="mt-1 text-gray-600">
                                                {categories.find(c => c.id === viewingCategory.parentId)?.name || 'N/A'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Subcategories */}
                                    {viewingCategory.subCategories && viewingCategory.subCategories.length > 0 && (
                                        <div>
                                            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                                                Subcategories ({viewingCategory.subCategories.length})
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {viewingCategory.subCategories.map((sub) => (
                                                    <Badge key={sub.id} variant="default">
                                                        {sub.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Metadata */}
                                    <div className="pt-4 border-t">
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div>
                                                <Label className="text-xs font-semibold text-gray-500">Created</Label>
                                                <p className="mt-1">
                                                    {new Date(viewingCategory.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(viewingCategory.createdAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })} by {viewingCategory.createdBy || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold text-gray-500">Last Updated</Label>
                                                <p className="mt-1">
                                                    {new Date(viewingCategory.updatedAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(viewingCategory.updatedAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })} by {viewingCategory.updatedBy || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowViewModal(false)}
                                        className="flex-1"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowViewModal(false);
                                            handleEditCategory(viewingCategory.id);
                                        }}
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Category
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}