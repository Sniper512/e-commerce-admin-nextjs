"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";

interface ProductSearchDropdownProps {
  selectedProductId: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  defaultProductImage?: string;
}

const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 20;

export function ProductSearchDropdown({
  selectedProductId,
  onSelect,
  placeholder = "Search and select a product...",
  searchValue,
  onSearchChange,
  defaultProductImage = "/images/default-image.svg",
}: ProductSearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    image: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
    image: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Fetch search results from API
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearch.length < MIN_SEARCH_LENGTH) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/products/search?q=${encodeURIComponent(debouncedSearch)}`
        );
        if (response.ok) {
          const results = await response.json();
          setSearchResults(results);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearch]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onSearchChange(value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelectProduct = (productId: string) => {
    // Find and store the selected item for display
    const selected = searchResults.find((item) => item.id === productId);
    if (selected) {
      setSelectedProduct(selected);
    }
    onSelect(productId);
    onSearchChange(""); // Clear search after selection
    setIsOpen(false);
  };

  const shouldShowDropdown = isOpen && searchValue.length >= MIN_SEARCH_LENGTH && searchResults.length > 0;

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
          {isSearching ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm">Searching products...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">
                No products found for "{debouncedSearch}"
              </p>
            </div>
          ) : (
            searchResults.map((product) => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
