"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import {
  Search,
  Trash2,
  Eye,
  Check,
  X,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { Category, SubCategory } from "@/types";
import categoryService from "@/services/categoryService";
import { LinkButton } from "@/components/ui/link-button";

interface CategoriesListProps {
  categoriesWithSubCategories: Array<{
    category: Category;
    subCategories: SubCategory[];
  }>;
}

type DisplayItem =
  | { type: "category"; data: Category }
  | { type: "subcategory"; data: SubCategory; parentId: string };

export function CategoriesList({
  categoriesWithSubCategories,
}: CategoriesListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Flatten the data structure for display
  const displayItems = useMemo(() => {
    const items: DisplayItem[] = [];
    categoriesWithSubCategories.forEach(({ category, subCategories }) => {
      items.push({ type: "category", data: category });
      subCategories.forEach((subCategory) => {
        items.push({
          type: "subcategory",
          data: subCategory,
          parentId: category.id,
        });
      });
    });
    return items;
  }, [categoriesWithSubCategories]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery) return displayItems;

    const query = searchQuery.toLowerCase();
    return displayItems.filter((item) => {
      const name = item.data.name.toLowerCase();
      return name.includes(query);
    });
  }, [displayItems, searchQuery]);

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await categoryService.deleteCategory(categoryId);
      alert("Category deleted successfully!");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error deleting category");
    }
  };

  const handleDeleteSubCategory = async (
    parentCategoryId: string,
    subCategoryId: string
  ) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) {
      return;
    }

    try {
      await categoryService.deleteSubCategory(parentCategoryId, subCategoryId);
      alert("Sub-category deleted successfully!");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "Error deleting sub-category"
      );
    }
  };

  return (
    <>
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
                <TableHead>Display Order</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead className="text-center">Navbar</TableHead>
                <TableHead className="text-center">Homepage</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
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
                filteredItems.map((item, index) => {
                  if (item.type === "category") {
                    const category = item.data;
                    return (
                      <TableRow
                        key={`cat-${category.id}`}
                        className="bg-gray-50">
                        <TableCell className="font-medium">
                          {category.displayOrder}
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div className="flex items-center gap-2">
                            {category.subCategoryCount > 0 ? (
                              <FolderOpen className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Folder className="h-4 w-4 text-gray-500" />
                            )}
                            {category.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              category.type === "special"
                                ? "default"
                                : "secondary"
                            }>
                            {category.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              category.isPublished ? "success" : "secondary"
                            }>
                            {category.isPublished ? "Published" : "Unpublished"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-center gap-2">
                            <LinkButton
                              variant="outline"
                              size="sm"
                              href={`/dashboard/categories/${category.id}`}>
                              <Eye className="h-3 w-3" />
                            </LinkButton>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  } else {
                    // Subcategory
                    const subCategory = item.data;
                    return (
                      <TableRow
                        key={`subcat-${subCategory.id}`}
                        className="hover:bg-blue-50/50">
                        <TableCell className="pl-8">
                          {subCategory.displayOrder}
                        </TableCell>
                        <TableCell className="pl-12">
                          {subCategory.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-gray-500">
                            —
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {subCategory.productCount ||
                            subCategory.productIds.length}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-gray-400">
                            —
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="text-gray-400">
                            —
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              subCategory.isPublished ? "success" : "secondary"
                            }>
                            {subCategory.isPublished
                              ? "Published"
                              : "Unpublished"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <LinkButton
                              variant="outline"
                              size="sm"
                              href={`/dashboard/categories/${item.parentId}?sub=${subCategory.id}`}>
                              <Eye className="h-3 w-3" />
                            </LinkButton>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteSubCategory(
                                  item.parentId,
                                  subCategory.id
                                )
                              }>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
