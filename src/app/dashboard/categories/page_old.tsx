'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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
import { Category } from '@/types';
import CategoryService from '@/services/categoryService';

export default function CategoriesPage() {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
    const [categoryStats, setCategoryStats] = React.useState({
        totalCategories: 0,
        publishedCategories: 0,
        rootCategories: 0,
        subCategories: 0,
        categoriesWithProducts: 0
    });

    // Form state
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        type: 'simple' as 'simple' | 'special',
        parentId: '',
        picture: '',
        displayOrder: 1,
        isPublished: true,
        showOnHomepage: false,
        showOnNavbar: false
    });

    // Load categories on mount
    React.useEffect(() => {
        loadCategories();
        loadStats();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await CategoryService.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const stats = await CategoryService.getCategoryStats();
            setCategoryStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    // Filter categories based on search
    const filteredCategories = React.useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(cat =>
            cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    // Get root categories for parent selection
    const rootCategories = React.useMemo(() => {
        return categories.filter(cat => !cat.parentId);
    }, [categories]);

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            type: 'simple',
            parentId: '',
            picture: '',
            displayOrder: 1,
            isPublished: true,
            showOnHomepage: false,
            showOnNavbar: false
        });
    };

    const handleAddCategory = () => {
        resetForm();
        setEditingCategory(null);
        setShowAddModal(true);
    };

    const handleEditCategory = (category: Category) => {
        setFormData({
            name: category.name,
            description: category.description || '',
            type: category.type,
            parentId: category.parentId || '',
            picture: category.picture || '',
            displayOrder: category.displayOrder,
            isPublished: category.isPublished,
            showOnHomepage: category.showOnHomepage,
            showOnNavbar: category.showOnNavbar
        });
        setEditingCategory(category);
        setShowAddModal(true);
    };

    const handleSaveCategory = async () => {
        try {
            setLoading(true);
            if (editingCategory) {
                await CategoryService.updateCategory(editingCategory.id, formData);
            } else {
                await CategoryService.createCategory(formData);
            }
            await loadCategories();
            await loadStats();
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving category:', error);
            alert('Error saving category');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

        try {
            setLoading(true);
            await CategoryService.deleteCategory(category.id);
            await loadCategories();
            await loadStats();
        } catch (error) {
            console.error('Error deleting category:', error);
            alert(error instanceof Error ? error.message : 'Error deleting category');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePublish = async (category: Category) => {
        try {
            setLoading(true);
            await CategoryService.togglePublishStatus(category.id);
            await loadCategories();
            await loadStats();
        } catch (error) {
            console.error('Error toggling publish status:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCategoryRow = (category: Category, level = 0) => {
        const indent = level * 20;

        return (
            <React.Fragment key={category.id}>
                <TableRow>
                    <TableCell className="font-medium">{category.displayOrder}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2" style={{ paddingLeft: `${indent}px` }}>
                            {level > 0 && (
                                <span className="text-gray-400">└─</span>
                            )}
                            {category.parentId ? (
                                <Folder className="h-4 w-4 text-gray-500" />
                            ) : (
                                <FolderOpen className="h-4 w-4 text-blue-500" />
                            )}
                            <div>
                                <div className="font-medium">{category.name}</div>
                                {category.description && (
                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                        {category.description}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        {category.parentCategory ? (
                            <span className="text-sm text-gray-600">{category.parentCategory.name}</span>
                        ) : (
                            <span className="text-gray-400">None</span>
                        )}
                    </TableCell>
                    <TableCell>
                        <Badge variant={category.type === 'special' ? 'default' : 'secondary'}>
                            {category.type}
                        </Badge>
                    </TableCell>
                    <TableCell>
                        {category.picture ? (
                            <div className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600">Yes</span>
                            </div>
                        ) : (
                            <span className="text-gray-400">No</span>
                        )}
                    </TableCell>
                    <TableCell>{category.productCount || 0}</TableCell>
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
                        <Badge variant={category.isPublished ? 'success' : 'secondary'}>
                            {category.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTogglePublish(category)}
                                disabled={loading}
                                title="Toggle publish status"
                            >
                                <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCategory(category)}
                                title="Edit category"
                            >
                                <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCategory(category)}
                                disabled={loading}
                                title="Delete category"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </TableCell>
                </TableRow>
                {/* Render subcategories */}
                {category.subCategories?.map(subCat => renderCategoryRow(subCat, level + 1))}
            </React.Fragment>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Categories</h1>
                        <p className="text-gray-600">Organize your products into categories and subcategories</p>
                    </div>
                    <Button onClick={handleAddCategory}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Category
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="text-2xl font-bold">{categoryStats.totalCategories}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <FolderOpen className="h-4 w-4 text-green-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Published</p>
                                    <p className="text-2xl font-bold">{categoryStats.publishedCategories}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-purple-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Root</p>
                                    <p className="text-2xl font-bold">{categoryStats.rootCategories}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Folder className="h-4 w-4 text-orange-500" />
                                <div>
                                    <p className="text-sm text-gray-600">Sub</p>
                                    <p className="text-2xl font-bold">{categoryStats.subCategories}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="text-sm text-gray-600">With Products</p>
                                    <p className="text-2xl font-bold">{categoryStats.categoriesWithProducts}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <Input
                                placeholder="Search categories by name or description..."
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
                                            Order
                                            <ArrowUpDown className="h-4 w-4" />
                                        </button>
                                    </TableHead>
                                    <TableHead>Name & Description</TableHead>
                                    <TableHead>Parent Category</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Picture</TableHead>
                                    <TableHead>Products</TableHead>
                                    <TableHead className="text-center">Navbar</TableHead>
                                    <TableHead className="text-center">Homepage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                                            No categories found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories
                                        .filter(cat => !cat.parentId) // Only show root categories, subcategories are rendered recursively
                                        .map(category => renderCategoryRow(category))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Add/Edit Category Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-semibold">
                                        {editingCategory ? 'Edit Category' : 'Add New Category'}
                                    </CardTitle>
                                    <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-sm font-medium">Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Category name"
                                            className="mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-sm font-medium">Description</Label>
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
                                            <Label htmlFor="type" className="text-sm font-medium">Type</Label>
                                            <Select
                                                value={formData.type}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'simple' | 'special' }))}
                                                className="mt-1"
                                            >
                                                <option value="simple">Simple</option>
                                                <option value="special">Special</option>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="displayOrder" className="text-sm font-medium">Display Order</Label>
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
                                        <Label htmlFor="parentId" className="text-sm font-medium">Parent Category</Label>
                                        <Select
                                            value={formData.parentId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                            className="mt-1"
                                        >
                                            <option value="">None (Root Category)</option>
                                            {rootCategories
                                                .filter(cat => editingCategory ? cat.id !== editingCategory.id : true)
                                                .map(cat => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))
                                            }
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="picture" className="text-sm font-medium">Picture URL</Label>
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
                                        {formData.picture && (
                                            <div className="mt-2">
                                                <img 
                                                    src={formData.picture} 
                                                    alt="Preview" 
                                                    className="w-20 h-20 object-cover rounded border"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Settings */}
                                <div>
                                    <Label className="text-sm font-medium mb-3 block">Settings</Label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 cursor-pointer">
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
                                        
                                        <label className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.showOnHomepage}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="font-medium">Show on Homepage</span>
                                                <p className="text-sm text-gray-500">Display this category on the homepage</p>
                                            </div>
                                        </label>
                                        
                                        <label className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.showOnNavbar}
                                                onChange={(e) => setFormData(prev => ({ ...prev, showOnNavbar: e.target.checked }))}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div>
                                                <span className="font-medium">Show on Navbar</span>
                                                <p className="text-sm text-gray-500">Include this category in the navigation menu</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Products Association Preview */}
                                {editingCategory && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">Products in this Category</Label>
                                        <div className="p-3 bg-gray-50 rounded border">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {editingCategory.productCount || 0}
                                                </span>
                                                <span className="text-sm text-gray-600">products assigned</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Products will be managed from the Products page
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button 
                                        onClick={handleSaveCategory} 
                                        disabled={loading || !formData.name.trim()}
                                        className="flex-1"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {editingCategory ? 'Update Category' : 'Create Category'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1"
                                        disabled={loading}
                                    >
                                        Cancel
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
                                    <Select
                                        value={formData.parentId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                                    >
                                        <option value="">None (Root Category)</option>
                                        {rootCategories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="picture">Picture URL</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="picture"
                                            value={formData.picture}
                                            onChange={(e) => setFormData(prev => ({ ...prev, picture: e.target.value }))}
                                            placeholder="Image URL"
                                        />
                                        <Button variant="outline" size="sm" title="Upload image">
                                            <Upload className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="displayOrder">Display Order</Label>
                                    <Input
                                        id="displayOrder"
                                        type="number"
                                        value={formData.displayOrder}
                                        onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublished}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                                        />
                                        <span>Published</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.showOnHomepage}
                                            onChange={(e) => setFormData(prev => ({ ...prev, showOnHomepage: e.target.checked }))}
                                        />
                                        <span>Show on Homepage</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.showOnNavbar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, showOnNavbar: e.target.checked }))}
                                        />
                                        <span>Show on Navbar</span>
                                    </label>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleSaveCategory}
                                        disabled={loading || !formData.name}
                                        className="flex-1"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {editingCategory ? 'Update' : 'Create'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1"
                                    >
                                        Cancel
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
