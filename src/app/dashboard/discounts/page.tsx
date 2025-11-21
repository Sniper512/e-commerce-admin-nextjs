// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import discountService from "@/services/discountService";
import { productService } from "@/services/productService";
import { DiscountsList } from "@/components/features/discounts/discounts-list";
import type { Discount } from "@/types";

export default async function DiscountsPage() {
  // Fetch all discounts on the server
  const allDiscounts = await discountService.getAll();

  // For now, limit to first 10 for main table (pagination can be added later)
  const mainTableDiscounts = allDiscounts.slice(0, 10);

  // Determine featured product-discount combinations
  const featuredItems: Array<{
    discount: Discount;
    product: { id: string; name: string; image: string };
  }> = [];

  for (const discount of allDiscounts) {
    if (discount.applicableTo === 'products' && discount.applicableProductIds && discount.applicableProductIds.length > 0) {
      // Check each product to see if it has this discount featured
      for (const productId of discount.applicableProductIds) {
        try {
          const product = await productService.getById(productId);
          if (product?.featuredDiscountIds?.includes(discount.id)) {
            featuredItems.push({
              discount,
              product: {
                id: product.id,
                name: product.info?.name || 'Unknown Product',
                image: product.multimedia?.images?.[0] || '/images/default-image.svg'
              }
            });
          }
        } catch (error) {
          console.error(`Error checking featured status for product ${productId}:`, error);
        }
      }
    }
  }

  // Serialize data for client component
  const serializedDiscounts = JSON.parse(JSON.stringify(mainTableDiscounts));
  const serializedFeaturedItems = JSON.parse(JSON.stringify(featuredItems));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discounts</h1>
          <p className="text-gray-600">
            Create and manage promotional discounts
          </p>
        </div>
        <Link href="/dashboard/discounts/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Discount
          </Button>
        </Link>
      </div>

      {/* Discounts List - Client Component */}
      <DiscountsList
        discounts={serializedDiscounts}
        featuredItems={serializedFeaturedItems}
      />
    </div>
  );
}
