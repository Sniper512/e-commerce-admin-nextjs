"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import Link from "next/link";
import { DiscountSearchDropdown } from "@/components/features/discounts/discount-search-dropdown";
import type { Discount } from "@/types";

interface ProductDiscountsTabProps {
  selectedDiscountIds: string[];
  onSelectedDiscountIdsChange: (value: string[]) => void;
  availableDiscounts: Discount[];
  discountSearchValue: string;
  onDiscountSearchValueChange: (value: string) => void;
}

export function ProductDiscountsTab({
  selectedDiscountIds,
  onSelectedDiscountIdsChange,
  availableDiscounts,
  discountSearchValue,
  onDiscountSearchValueChange,
}: ProductDiscountsTabProps) {
  const handleAddDiscount = (discountId: string) => {
    if (!selectedDiscountIds.includes(discountId)) {
      onSelectedDiscountIdsChange([...selectedDiscountIds, discountId]);
    }
  };

  const handleRemoveDiscount = (discountId: string) => {
    onSelectedDiscountIdsChange(
      selectedDiscountIds.filter((id) => id !== discountId)
    );
  };

  const getDiscountById = (discountId: string) => {
    return availableDiscounts.find((d) => d.id === discountId);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Discounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="form-group">
            <div className="flex items-center justify-between mb-2">
              <Label className="form-label">Discounts</Label>
              <Link href="/dashboard/discounts">
                <Button type="button" variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Discount
                </Button>
              </Link>
            </div>

            <DiscountSearchDropdown
              availableDiscounts={availableDiscounts}
              selectedDiscountId=""
              onSelect={handleAddDiscount}
              placeholder="Search and add discounts..."
              searchValue={discountSearchValue}
              onSearchChange={onDiscountSearchValueChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Search for discounts and click to add them to this product
            </p>

            {/* Display selected discounts */}
            {selectedDiscountIds.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-purple-800">
                  Applied Discounts ({selectedDiscountIds.length}):
                </p>
                <div className="space-y-2">
                  {selectedDiscountIds.map((discountId) => {
                    const discount = getDiscountById(discountId);
                    if (!discount) return null;

                    const isActive =
                      discount.isActive &&
                      new Date(discount.startDate) <= new Date() &&
                      new Date(discount.endDate) >= new Date();

                    return (
                      <div
                        key={discountId}
                        className={`flex items-center gap-3 p-3 rounded-md border ${
                          isActive
                            ? "bg-purple-50 border-purple-200"
                            : "bg-gray-50 border-gray-200"
                        }`}>
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                          {discount.type === "percentage" ? (
                            <span className="text-purple-600 font-semibold">
                              {discount.value}%
                            </span>
                          ) : (
                            <span className="text-purple-600 font-semibold text-xs">
                              ₦{discount.value}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm text-purple-900">
                              {discount.name}
                            </div>
                            {isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-purple-700">
                            {discount.type === "percentage"
                              ? `${discount.value}% off`
                              : `₦${discount.value} off`}
                            {discount.description &&
                              ` • ${discount.description}`}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscount(discountId)}
                          className="text-red-600 hover:text-red-800 p-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDiscountIds.length === 0 && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-center text-sm text-gray-600">
                No discounts applied yet. Search and add discounts above.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
