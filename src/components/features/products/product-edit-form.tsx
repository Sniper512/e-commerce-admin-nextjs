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
import { ProductRelatedTab } from "./tabs/product-related-tab";
import { ProductCrossSellTab } from "./tabs/product-cross-sell-tab";
import { ProductOrderHistoryTab } from "./tabs/product-order-history-tab";

interface ProductEditFormProps {
  product: any; // Serialized product
  availableProducts: any[];
  availableDiscounts: any[];
}

export function ProductEditForm({
  product,
  availableProducts,
  availableDiscounts,
}: ProductEditFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  // Get active tab from URL search params, default to "info"
  const activeTab = searchParams.get("tab") || "info";

  // Form state
  const [formData, setFormData] = useState({
    name: product.info.name,
    description: product.info.description || "",
    categories: product.info.categories || [],
    manufacturer: product.info.manufacturer || "",
    productTags: product.info.productTags || [],
    isPublished: product.info.isPublished,
    allowCustomerReviews: product.info.allowCustomerReviews,
    markAsNew: product.info.markAsNew,
    markAsNewStartDate: product.info.markAsNewStartDate,
    markAsNewEndDate: product.info.markAsNewEndDate,
    productCost: product.pricing.productCost || 0,
    minBuy: product.pricing.minBuy || 1,
    maxBuy: product.pricing.maxBuy || 999,
    stockQuantity: product.inventory.stockQuantity,
    minimumStockQuantity: product.inventory.minimumStockQuantity,
  });

  const [images, setImages] = useState(
    product.multimedia.images?.map((img: any, index: number) => ({
      id: index.toString(),
      url: img.url,
      altText: img.altText || "",
      isPrimary: img.isPrimary,
      sortOrder: img.sortOrder,
    })) || []
  );

  const [relatedProducts, setRelatedProducts] = useState(
    product.relatedProducts || []
  );

  const [crossSellProducts, setCrossSellProducts] = useState(
    product.crossSellProducts || []
  );

  const [selectedDiscountIds, setSelectedDiscountIds] = useState(
    product.pricing.discountIds || []
  );

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

      const updatedProduct: Partial<Product> = {
        slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
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
          images: images.map((img: ProductImage) => ({
            id: img.id,
            url: img.url,
            altText: img.altText,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          })),
          videos: product.multimedia.videos || [],
        },
        relatedProducts: relatedProducts,
        crossSellProducts: crossSellProducts,
        isActive: formData.isPublished,
      };

      await productService.update(product.id, updatedProduct);
      alert("Product updated successfully!");
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product. Please try again.");
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
            <h1 className="text-3xl font-bold">
              {formData.name || "Product Details"}
            </h1>
            <p className="text-gray-600">Manage all aspects of your product</p>
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
          categories={[]}
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
        <ProductRelatedTab
          relatedProducts={relatedProducts}
          onRelatedProductsChange={setRelatedProducts}
          availableProducts={availableProducts}
          defaultImage=""
        />
      )}
      {activeTab === "crosssell" && (
        <ProductCrossSellTab
          crossSellProducts={crossSellProducts}
          onCrossSellProductsChange={setCrossSellProducts}
          availableProducts={availableProducts}
          defaultImage=""
        />
      )}
      {activeTab === "orders" && (
        <ProductOrderHistoryTab
          purchaseHistory={product.purchaseHistory || []}
        />
      )}
    </div>
  );
}
