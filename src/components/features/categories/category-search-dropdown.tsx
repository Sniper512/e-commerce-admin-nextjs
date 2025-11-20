"use client";

import { useState, useEffect, useRef } from "react";

// Flattened item for search (can be category or subcategory)
interface SearchableItem {
  id: string;
  name: string;
  description?: string;
  parentName?: string; // For subcategories, show parent category name
  isSubCategory: boolean;
}

interface CategorySearchDropdownProps {
  onSelect: (categoryId: string) => void;
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

const MIN_SEARCH_LENGTH = 2;

export function CategorySearchDropdown({
  onSelect,
  placeholder = "Search and select a category...",
  searchValue,
  onSearchChange,
}: CategorySearchDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SearchableItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchableItem | null>(null);
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
          `/api/categories/search?q=${encodeURIComponent(debouncedSearch)}`
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

  const handleSelectCategory = (categoryId: string) => {
    // Find and store the selected item for display
    const selected = searchResults.find((item) => item.id === categoryId);
    if (selected) {
      setSelectedItem(selected);
    }
    onSelect(categoryId);
    onSearchChange(""); // Clear search after selection
    setIsOpen(false);
  };

  const shouldShowDropdown = isOpen && searchValue.length >= MIN_SEARCH_LENGTH;

  const showMinLengthHint =
    isOpen && searchValue.length > 0 && searchValue.length < MIN_SEARCH_LENGTH;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedItem ? selectedItem.name : placeholder}
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
              <p className="mt-2 text-sm">Searching categories...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">
                No categories found for "{debouncedSearch}"
              </p>
            </div>
          ) : (
            <>
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectCategory(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center ${
                      item.isSubCategory
                        ? "bg-blue-100 text-blue-600"
                        : "bg-teal-100 text-teal-600"
                    }`}>
                    <span className="font-semibold text-sm">
                      {item.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {item.name}
                      {item.isSubCategory && item.parentName && (
                        <span className="ml-2 text-xs text-gray-500 font-normal">
                          in {item.parentName}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
