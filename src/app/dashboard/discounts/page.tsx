import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import discountService from "@/services/discountService";
import { DiscountsList } from "@/components/features/discounts/discounts-list";

export default async function DiscountsPage() {
  // Fetch discounts on the server
  const discounts = await discountService.getAll();

  // Serialize data for client component
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));

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
      <DiscountsList discounts={serializedDiscounts} />
    </div>
  );
}
