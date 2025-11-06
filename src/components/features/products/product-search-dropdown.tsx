"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";

interface ProductSearchDropdownProps {
  availableProducts: {
    id: string;
    name: string;
    image: string;
  }[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  defaultProductImage: string;
}

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 20;

export function ProductSearchDropdown({
  availableProducts,
  selectedProductId,
  onSelect,
  placeholder = "Search and select a product...",
  searchValue,
  onSearchChange,
  defaultProductImage,
}: ProductSearchDropdownProps) {
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

  // Memoize filtered products with min search length and result limit
  const { displayedProducts, totalFiltered } = useMemo(() => {
    // Don't filter if search is too short
    if (debouncedSearch.length < MIN_SEARCH_LENGTH) {
      return { displayedProducts: [], totalFiltered: 0 };
    }

    const search = debouncedSearch.toLowerCase();
    const filtered = availableProducts.filter((product) =>
      product.name.toLowerCase().includes(search)
    );

    return {
      displayedProducts: filtered.slice(0, MAX_RESULTS),
      totalFiltered: filtered.length,
    };
  }, [debouncedSearch, availableProducts]);

  const selectedProduct = availableProducts.find(
    (p) => p.id === selectedProductId
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectProduct = (productId: string) => {
    onSelect(productId);
    onSearchChange(""); // Clear search after selection
    setIsOpen(false);
  };

  const shouldShowDropdown =
    isOpen &&
    searchValue.length >= MIN_SEARCH_LENGTH &&
    displayedProducts.length > 0;

  const showMinLengthHint =
    isOpen && searchValue.length > 0 && searchValue.length < MIN_SEARCH_LENGTH;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedProduct ? selectedProduct.name : placeholder}
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
          {displayedProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelectProduct(product.id)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left">
              <Image
                src={product.image}
                alt={product.name}
                className="w-10 h-10 object-cover rounded"
                width={40}
                height={40}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultProductImage;
                }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm">{product.name}</div>
              </div>
            </button>
          ))}
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
