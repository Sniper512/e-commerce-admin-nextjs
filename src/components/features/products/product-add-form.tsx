"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import type { Product, ProductImage } from "@/types";
import { ProductEditTabs } from "./product-edit-tabs";
import { ProductInfoTab } from "./tabs/product-info-tab";
import { ProductDiscountsTab } from "./tabs/product-discounts-tab";
import { ProductInventoryTab } from "./tabs/product-inventory-tab";
import { ProductMultimediaTab } from "./tabs/product-multimedia-tab";
import { ProductSimilarTab } from "./tabs/product-similar-tab";
import { ProductBoughtTogetherTab } from "./tabs/product-bought-together-tab";

interface ProductAddFormProps {
  availableProducts: any[];
  availableDiscounts: any[];
  categories: any[];
}

export function ProductAddForm({
  availableProducts,
  availableDiscounts,
  categories,
}: ProductAddFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  // Get active tab from URL search params, default to "info"
  const activeTab = searchParams.get("tab") || "info";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categories: [] as string[],
    manufacturer: "",
    productTags: [] as string[],
    isPublished: true,
    allowCustomerReviews: true,
    markAsNew: false,
    markAsNewStartDate: undefined as Date | undefined,
    markAsNewEndDate: undefined as Date | undefined,
    stockQuantity: 0,
    minimumStockQuantity: 10,
  });

  const [images, setImages] = useState<ProductImage[]>([
    {
      id: "1",
      url: "",
      altText: "",
      isPrimary: true,
      sortOrder: 1,
    },
  ]);

  const [similarProducts, setSimilarProducts] = useState<
    Array<{
      productId: string;
      productName: string;
      price: number;
      imageUrl?: string;
    }>
  >([]);

  const [boughtTogetherProducts, setBoughtTogetherProducts] = useState<
    Array<{
      productId: string;
      productName: string;
      price: number;
      imageUrl?: string;
      sortOrder: number;
    }>
  >([]);

  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [discountSearchValue, setDiscountSearchValue] = useState("");

  // Function to change tab and update URL
  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const newProduct: Partial<Product> = {
        slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
        sku: `SKU-${Date.now()}`,
        type: "single",
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
        discountIds: selectedDiscountIds,
        inventory: {
          stockQuantity: formData.stockQuantity,
          minimumStockQuantity: formData.minimumStockQuantity,
        },
        multimedia: {
          images: images
            .filter((img) => img.url)
            .map((img) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
              isPrimary: img.isPrimary,
              sortOrder: img.sortOrder,
            })),
          videos: [],
        },
        similarProducts: similarProducts,
        boughtTogetherProducts: boughtTogetherProducts,
        isActive: formData.isPublished,
        purchaseHistory: [],
        stockHistory: [],
      };

      await productService.create(
        newProduct as Omit<Product, "id" | "createdAt" | "updatedAt">
      );
      alert("Product created successfully!");
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Error creating product:", err);
      alert("Failed to create product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
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
            <p className="text-gray-600">Create a new product for your store</p>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Tabs Navigation */}
      <ProductEditTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      {activeTab === "info" && (
        <ProductInfoTab
          productName={formData.name}
          onProductNameChange={(value: string) =>
            setFormData({ ...formData, name: value })
          }
          description={formData.description}
          onDescriptionChange={(value: string) =>
            setFormData({ ...formData, description: value })
          }
          categoryId={formData.categories[0] || ""}
          onCategoryIdChange={(value: string) =>
            setFormData({ ...formData, categories: [value] })
          }
          categories={categories}
          manufacturer={formData.manufacturer}
          onManufacturerChange={(value: string) =>
            setFormData({ ...formData, manufacturer: value })
          }
          productTags={formData.productTags}
          onProductTagsChange={(value: string[]) =>
            setFormData({ ...formData, productTags: value })
          }
          isPublished={formData.isPublished}
          onIsPublishedChange={(value: boolean) =>
            setFormData({ ...formData, isPublished: value })
          }
          allowCustomerReviews={formData.allowCustomerReviews}
          onAllowCustomerReviewsChange={(value: boolean) =>
            setFormData({ ...formData, allowCustomerReviews: value })
          }
          markAsNew={formData.markAsNew}
          onMarkAsNewChange={(value: boolean) =>
            setFormData({ ...formData, markAsNew: value })
          }
          markAsNewStartDate={formData.markAsNewStartDate}
          onMarkAsNewStartDateChange={(value: Date | undefined) =>
            setFormData({ ...formData, markAsNewStartDate: value })
          }
          markAsNewEndDate={formData.markAsNewEndDate}
          onMarkAsNewEndDateChange={(value: Date | undefined) =>
            setFormData({ ...formData, markAsNewEndDate: value })
          }
        />
      )}
      {activeTab === "discounts" && (
        <ProductDiscountsTab
          selectedDiscountIds={selectedDiscountIds}
          onSelectedDiscountIdsChange={setSelectedDiscountIds}
          availableDiscounts={availableDiscounts}
          discountSearchValue={discountSearchValue}
          onDiscountSearchValueChange={setDiscountSearchValue}
        />
      )}
      {activeTab === "inventory" && (
        <ProductInventoryTab
          stockQuantity={formData.stockQuantity}
          minimumStockQuantity={formData.minimumStockQuantity}
          onMinimumStockQuantityChange={(value: number) =>
            setFormData({ ...formData, minimumStockQuantity: value })
          }
        />
      )}
      {activeTab === "multimedia" && (
        <ProductMultimediaTab images={images} onImagesChange={setImages} />
      )}
      {activeTab === "related" && (
        <ProductSimilarTab
          similarProducts={similarProducts}
          onSimilarProductsChange={setSimilarProducts}
          availableProducts={availableProducts}
          defaultImage=""
        />
      )}
      {activeTab === "bought-together" && (
        <ProductBoughtTogetherTab
          boughtTogetherProducts={boughtTogetherProducts}
          onboughtTogetherProductsChange={setBoughtTogetherProducts}
          availableProducts={availableProducts}
          defaultImage=""
        />
      )}
    </div>
  );
}
