"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Percent, DollarSign } from "lucide-react";

interface Discount {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  description?: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
}

interface DiscountSearchDropdownProps {
  availableDiscounts: Discount[];
  selectedDiscountId: string;
  onSelect: (discountId: string) => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 20;

export function DiscountSearchDropdown({
  availableDiscounts,
  selectedDiscountId,
  onSelect,
  placeholder = "Search and select a discount...",
  searchValue,
  onSearchChange,
}: DiscountSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Memoize filtered discounts with min search length and result limit
  const { displayedDiscounts, totalFiltered } = useMemo(() => {
    // Don't filter if search is too short
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) {
      return { displayedDiscounts: [], totalFiltered: 0 };
    }

    const search = debouncedSearch.toLowerCase();
    const filtered = availableDiscounts.filter(
      (discount) =>
        discount.name.toLowerCase().includes(search) ||
        (discount.description &&
          discount.description.toLowerCase().includes(search))
    );

    return {
      displayedDiscounts: filtered.slice(0, MAX_RESULTS),
      totalFiltered: filtered.length,
    };
  }, [debouncedSearch, availableDiscounts]);

  const selectedDiscount = availableDiscounts.find(
    (d) => d.id === selectedDiscountId
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectDiscount = (discountId: string) => {
    onSelect(discountId);
    onSearchChange(""); // Clear search after selection
    setIsOpen(false);
  };

  const formatDiscountValue = (discount: Discount) => {
    if (discount.type === "percentage") {
      return `${discount.value}% off`;
    }
    return `₦${discount.value} off`;
  };

  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    return (
      discount.isActive &&
      new Date(discount.startDate) <= now &&
      new Date(discount.endDate) >= now
    );
  };

  const shouldShowDropdown =
    isOpen &&
    searchValue.length >= MIN_SEARCH_LENGTH &&
    displayedDiscounts.length > 0;

  const showMinLengthHint =
    isOpen && searchValue.length > 0 && searchValue.length < MIN_SEARCH_LENGTH;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedDiscount ? selectedDiscount.name : placeholder}
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {showMinLengthHint && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">
            Type at least {MIN_SEARCH_LENGTH} characters to search...
          </p>
        </div>
      )}

      {shouldShowDropdown && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {displayedDiscounts.map((discount) => {
            const isActive = isDiscountActive(discount);
            return (
              <button
                key={discount.id}
                type="button"
                onClick={() => handleSelectDiscount(discount.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left ${
                  !isActive ? "opacity-50" : ""
                }`}
                disabled={!isActive}>
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                  {discount.type === "percentage" ? (
                    <Percent className="w-5 h-5 text-purple-600" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">{discount.name}</div>
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDiscountValue(discount)}
                    {discount.description && ` • ${discount.description}`}
                  </div>
                </div>
              </button>
            );
          })}
          {totalFiltered > MAX_RESULTS && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Showing {MAX_RESULTS} of {totalFiltered} results. Keep typing to
                narrow down...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
