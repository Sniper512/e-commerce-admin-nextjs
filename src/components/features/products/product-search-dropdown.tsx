"use client";

import { Product } from "@/types";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Memoize filtered products to prevent unnecessary recalculations
  const filteredProducts = useMemo(() => {
    if (!searchValue) return availableProducts;
    const search = searchValue.toLowerCase();
    return availableProducts.filter((product) =>
      product.name.toLowerCase().includes(search)
    );
  }, [searchValue, availableProducts]);

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
    // Don't close dropdown to allow multiple selections
  };

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

      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredProducts.map((product) => (
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
        </div>
      )}
    </div>
  );
}
