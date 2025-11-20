"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import type { Product, Batch } from "@/types";
import type {
  ProductImageWithFile,
  ProductVideoWithFile,
} from "./tabs/product-multimedia-tab";
import { ProductEditTabs } from "./product-edit-tabs";
import { ProductInfoTab } from "./tabs/product-info-tab";
import { ProductDiscountsTab } from "./tabs/product-discounts-tab";
import { ProductInventoryTab } from "./tabs/product-inventory-tab";
import { ProductMultimediaTab } from "./tabs/product-multimedia-tab";
import { ProductSimilarTab } from "./tabs/product-similar-tab";
import { ProductBoughtTogetherTab } from "./tabs/product-bought-together-tab";
import { ProductOrderHistoryTab } from "./tabs/product-order-history-tab";

interface ProductEditFormProps {
  product: Product; // Serialized product
  availableProducts: Array<{ id: string; name: string; image: string }>;
  similarProducts: Array<{ id: string; name: string; image: string }>; // Populated similar products
  boughtTogetherProducts: Array<{ id: string; name: string; image: string }>; // Populated bought-together products
  availableDiscounts: any[];
  categories: any[];
  manufacturers: any[];
  batches: Batch[]; // Add batches prop
}

export function ProductEditForm({
  product,
  availableProducts,
  similarProducts,
  boughtTogetherProducts,
  availableDiscounts,
  categories,
  manufacturers,
  batches,
}: ProductEditFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);

  // Get active tab from URL search params, default to "info"
  const activeTab = searchParams.get("tab") || "info";

  const [formData, setFormData] = useState({
    name: product.info.name,
    description: product.info.description || "",
    categoryIds: product.info.categoryIds || [],
    manufacturerId: product.info.manufacturerId || "",
    productTags: product.info.productTags || [],
    isActive: product.info.isActive,
    allowCustomerReviews: product.info.allowCustomerReviews,
    markAsNew: product.info.markAsNew,
    markAsNewStartDate: product.info.markAsNewStartDate,
    markAsNewEndDate: product.info.markAsNewEndDate,
    minimumStockQuantity: product.minimumStockQuantity,
  });

  const [images, setImages] = useState<ProductImageWithFile[]>(
    product.multimedia.images?.map((url: string) => ({
      url: url,
    })) || []
  );

  const [video, setVideo] = useState<ProductVideoWithFile | null>(
    product.multimedia.video
      ? {
          url: product.multimedia.video,
        }
      : null
  );

  const [similarProductIds, setSimilarProductIds] = useState(
    product.similarProductIds || []
  );

  const [boughtTogetherProductIds, setBoughtTogetherProductIds] = useState(
    product.boughtTogetherProductIds || []
  );

  const [selectedDiscountIds, setSelectedDiscountIds] = useState(
    product.discountIds || []
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
          categoryIds: formData.categoryIds,
          manufacturerId: formData.manufacturerId,
          productTags: formData.productTags,
          isActive: formData.isActive,
          allowCustomerReviews: formData.allowCustomerReviews,
          markAsNew: formData.markAsNew,
          markAsNewStartDate: formData.markAsNewStartDate,
          markAsNewEndDate: formData.markAsNewEndDate,
        },
        discountIds: selectedDiscountIds,
        minimumStockQuantity: formData.minimumStockQuantity,
        multimedia: {
          images: [],
          video: "",
        },
        similarProductIds: similarProductIds,
        boughtTogetherProductIds: boughtTogetherProductIds,
      };

      // Pass images and video to service for upload
      await productService.update(product.id, updatedProduct, images, video);
      showToast("Product updated successfully!");
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Error updating product:", err);
      showToast("Failed to update product. Please try again.");
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
          categoryIds={formData.categoryIds}
          onCategoryIdsChange={(value: string[]) =>
            setFormData({ ...formData, categoryIds: value })
          }
          categories={categories}
          manufacturerId={formData.manufacturerId}
          onManufacturerIdChange={(value: string) =>
            setFormData({ ...formData, manufacturerId: value })
          }
          manufacturers={manufacturers}
          productTags={formData.productTags}
          onProductTagsChange={(value: string[]) =>
            setFormData({ ...formData, productTags: value })
          }
          isActive={formData.isActive}
          onIsActiveChange={(value: boolean) =>
            setFormData({ ...formData, isActive: value })
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
          price={product.price}
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
          minimumStockQuantity={formData.minimumStockQuantity}
          onMinimumStockQuantityChange={(value: number | "") =>
            setFormData({
              ...formData,
              minimumStockQuantity: typeof value === "number" ? value : 0,
            })
          }
          batches={batches}
          productId={product.id}
        />
      )}
      {activeTab === "multimedia" && (
        <ProductMultimediaTab
          images={images}
          onImagesChange={setImages}
          video={video}
          onVideoChange={setVideo}
        />
      )}
      {activeTab === "similar" && (
        <ProductSimilarTab
          similarProductIds={similarProductIds}
          onSimilarProductIdsChange={setSimilarProductIds}
          availableProducts={availableProducts}
          selectedProducts={similarProducts}
          defaultImage=""
        />
      )}
      {activeTab === "bought-together" && (
        <ProductBoughtTogetherTab
          boughtTogetherProductIds={boughtTogetherProductIds}
          onBoughtTogetherProductIdsChange={setBoughtTogetherProductIds}
          availableProducts={availableProducts}
          selectedProducts={boughtTogetherProducts}
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
