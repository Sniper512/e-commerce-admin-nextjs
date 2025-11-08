"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package } from "lucide-react";
import { Input } from "../../ui/input";
import Image from "next/image";

interface ProductSearchItem {
  id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  batchId: string;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
}

interface ProductOrderSearchDropdownProps {
  products: ProductSearchItem[];
  onSelect: (product: ProductSearchItem) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export function ProductOrderSearchDropdown({
  products,
  onSelect,
  placeholder = "Search products by name...",
  excludeIds = [],
}: ProductOrderSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<ProductSearchItem[]>(
    []
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const filtered = products.filter(
          (product) =>
            !excludeIds.includes(product.id) &&
            product.name.toLowerCase().includes(query)
        );
        setFilteredProducts(filtered);
        setIsOpen(true);
      } else {
        setFilteredProducts([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, products, excludeIds]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: ProductSearchItem) => {
    onSelect(product);
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim() && filteredProducts.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Dropdown */}
      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors">
              <div className="flex items-center gap-3">
                {product.image ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.name}
                  </p>
                  <div className="flex gap-3 mt-1 flex-wrap items-center">
                    {product.discountPercentage > 0 ? (
                      <>
                        <span className="text-sm text-gray-400 line-through">
                          Rs. {Math.floor(product.price).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          Rs. {Math.floor(product.finalPrice).toLocaleString()}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          {product.discountPercentage}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-600">
                        Rs. {Math.floor(product.price).toLocaleString()}
                      </span>
                    )}
                    <span
                      className={`text-sm ${
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.trim() && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No products found
        </div>
      )}
    </div>
  );
}
