"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { productService } from "@/services/productService";
import { useToast } from "@/components/ui/toast-context";
import type { Product } from "@/types";
import type {
  ProductImageWithFile,
  ProductVideoWithFile,
} from "./tabs/product-multimedia-tab";
import { ProductInfoTab } from "./tabs/product-info-tab";
import { ProductDiscountsTab } from "./tabs/product-discounts-tab";
import { ProductInventoryTab } from "./tabs/product-inventory-tab";
import { ProductMultimediaTab } from "./tabs/product-multimedia-tab";
import { ProductBoughtTogetherTab } from "./tabs/product-bought-together-tab";
import { ProductAddTabs } from "./product-add-tabs";

interface ProductAddFormProps {
  availableProducts: Array<{ id: string; name: string; image: string }>;
  availableDiscounts: any[];
  categories: any[];
  manufacturers: any[];
}

export function ProductAddForm({
  availableProducts,
  availableDiscounts,
  categories,
  manufacturers,
}: ProductAddFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Get active tab from URL search params, default to "info"
  const [activeTab, setActiveTab] = useState("info");

  // Update active tab when component mounts or URL changes
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const tabFromUrl = urlParams.get("tab") || "info";
      setActiveTab(tabFromUrl);
    } catch (error) {
      console.error("Error parsing URL params:", error);
      setActiveTab("info");
    }
  }, []);

  // Form state - using useMemo to prevent hydration mismatch
  const initialFormData = {
    name: "",
    description: "",
    categoryIds: [] as string[],
    manufacturerId: "",
    productTags: [] as string[],
    isActive: true,
    allowCustomerReviews: true,
    markAsNew: false,
    markAsNewStartDate: undefined as Date | undefined,
    markAsNewEndDate: undefined as Date | undefined,
    stockQuantity: 0,
    minimumStockQuantity: 10,
  };

  const [formData, setFormData] = useState(initialFormData);

  const [images, setImages] = useState<ProductImageWithFile[]>([]);

  const [video, setVideo] = useState<ProductVideoWithFile | null>(null);


  const [boughtTogetherProductIds, setBoughtTogetherProductIds] = useState<
    string[]
  >([]);

  const [selectedDiscountIds, setSelectedDiscountIds] = useState<string[]>([]);
  const [discountSearchValue, setDiscountSearchValue] = useState("");

  // Function to change tab and update URL
  const handleTabChange = (tab: string) => {
    try {
      setActiveTab(tab);
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("tab", tab);
      router.push(currentUrl.pathname + currentUrl.search);
    } catch (error) {
      console.error("Error changing tab:", error);
      // Fallback: try to navigate without search params
      router.push(`${pathname}?tab=${tab}`);
    }
  };

  const handleSave = async () => {
    try {
      // Validation for required fields
      if (!formData.name.trim()) {
        showToast("error", "Validation Error", "Product Name is required!");
        return;
      }

      if (formData.categoryIds.length === 0) {
        showToast("error", "Validation Error", "Please select at least one category!");
        return;
      }

      if (
        formData.minimumStockQuantity === undefined ||
        formData.minimumStockQuantity < 0
      ) {
        showToast("error", "Validation Error", "Minimum Stock Quantity is required and must be 0 or greater!");
        return;
      }

      setSaving(true);

      const newProduct: Partial<Product> = {
        slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
        info: {
          name: formData.name,
          nameLower: formData.name.toLowerCase(),
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
        boughtTogetherProductIds: boughtTogetherProductIds,
        purchaseHistory: [],
      };

      // Pass images and video to service for upload
      await productService.create(
        newProduct as Omit<Product, "id">,
        images,
        video
      );
      showToast("success", "Product created successfully!");
      router.push("/dashboard/products");
    } catch (err) {
      console.error("Error creating product:", err);
      showToast("error", "Failed to create product", "Please try again.");
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
      <ProductAddTabs activeTab={activeTab} onTabChange={handleTabChange} />

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
          batches={[]}
          productId={undefined}
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
      {activeTab === "bought-together" && (
        <ProductBoughtTogetherTab
          boughtTogetherProductIds={boughtTogetherProductIds}
          onBoughtTogetherProductIdsChange={setBoughtTogetherProductIds}
          availableProducts={availableProducts}
          selectedProducts={[]} // Empty for new product
          defaultImage=""
        />
      )}
    </div>
  );
}
