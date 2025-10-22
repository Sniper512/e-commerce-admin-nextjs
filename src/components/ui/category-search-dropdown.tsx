'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

interface Category {
    id: string;
    name: string;
    description?: string;
}

interface CategorySearchDropdownProps {
    availableCategories: Category[];
    selectedCategoryId: string;
    onSelect: (categoryId: string) => void;
    placeholder?: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
}

export function CategorySearchDropdown({
    availableCategories,
    selectedCategoryId,
    onSelect,
    placeholder = "Search and select a category...",
    searchValue,
    onSearchChange
}: CategorySearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Memoize filtered categories to prevent unnecessary recalculations
    const filteredCategories = useMemo(() => {
        if (!searchValue) return availableCategories;
        const search = searchValue.toLowerCase();
        return availableCategories.filter(category =>
            category.name.toLowerCase().includes(search) ||
            (category.description && category.description.toLowerCase().includes(search))
        );
    }, [searchValue, availableCategories]);

    const selectedCategory = availableCategories.find(c => c.id === selectedCategoryId);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        onSearchChange(value);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelectCategory = (categoryId: string) => {
        onSelect(categoryId);
        onSearchChange(''); // Clear search after selection
        // Don't close dropdown to allow multiple selections
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={selectedCategory ? selectedCategory.name : placeholder}
                    value={searchValue}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            {isOpen && filteredCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCategories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleSelectCategory(category.id)}
                            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left"
                        >
                            <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded flex items-center justify-center">
                                <span className="text-teal-600 font-semibold text-sm">
                                    {category.name.substring(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-sm">{category.name}</div>
                                {category.description && (
                                    <div className="text-xs text-gray-500 truncate">{category.description}</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
