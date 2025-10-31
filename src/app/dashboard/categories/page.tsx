"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Eye, ArrowUpDown, Check, X } from "lucide-react";
import { Category } from "@/types";
import categoryService from "@/services/categoryService";

export default function CategoriesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [categories, setCategories] = React.useState<Category[]>([]);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await categoryService.getAllCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await categoryService.deleteCategory(categoryId);
      alert("Category deleted successfully!");
      await loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Error deleting category");
    }
  };

  const filteredCategories = categories.filter((cat: Category) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-gray-600">
            Organize your products into categories
          </p>
        </div>
        <Link href="/dashboard/categories/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

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
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500">
                    {searchQuery
                      ? "No categories found matching your search"
                      : "No categories yet. Create your first category!"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.displayOrder}
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.type === "special" ? "default" : "secondary"
                        }>
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.productCount || category.productIds.length}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.showOnNavbar ? (
                        <Badge variant="success">
                          <Check className="h-4 w-4" />
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-4 w-4" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.showOnHomepage ? (
                        <Badge variant="success">
                          <Check className="h-4 w-4" />
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <X className="h-4 w-4" />
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.isPublished ? "success" : "secondary"
                        }>
                        {category.isPublished ? "Published" : "Unpublished"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/categories/${category.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
