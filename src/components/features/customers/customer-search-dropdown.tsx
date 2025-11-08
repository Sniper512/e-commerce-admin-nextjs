"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User } from "lucide-react";
import { Input } from "../../ui/input";
import type { Customer, CustomerSearchResult } from "@/types";

interface CustomerSearchDropdownProps {
  customers: CustomerSearchResult[];
  selectedCustomerId: string | null;
  onSelect: (customerId: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function CustomerSearchDropdown({
  customers,
  selectedCustomerId,
  onSelect,
  onClear,
  placeholder = "Search customers by name or phone...",
}: CustomerSearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<
    CustomerSearchResult[]
  >([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const filtered = customers.filter(
          (customer) =>
            customer.name.toLowerCase().includes(query) ||
            customer.phone.includes(searchQuery)
        );
        setFilteredCustomers(filtered);
        setIsOpen(true);
      } else {
        setFilteredCustomers([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, customers]);

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

  const handleSelect = (customerId: string) => {
    onSelect(customerId);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setSearchQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {selectedCustomer ? (
        <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-blue-50">
          <User className="h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
            <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-blue-100 rounded-full transition-colors">
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim() && filteredCustomers.length > 0) {
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSelect(customer.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && searchQuery.trim() && filteredCustomers.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No customers found
        </div>
      )}
    </div>
  );
}
