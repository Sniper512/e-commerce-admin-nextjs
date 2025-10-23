'use client';

import { useState, useEffect } from 'react';
import { productService } from '@/services/productService';
import { Product } from '@/types';
import { ProductSearchDropdown } from './product-search-dropdown';
import { DEFAULT_IMAGES } from '@/lib/defaultImages';

interface CartonProductSearchProps {
    onSelect: (productId: string, productName: string, sku: string, imageUrl?: string) => void;
    placeholder?: string;
}

export function CartonProductSearch({ onSelect, placeholder }: CartonProductSearchProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchValue, setSearchValue] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const allProducts = await productService.getAll();
            setProducts(allProducts);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const handleSelect = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            onSelect(
                product.id,
                product.info.name,
                product.sku,
                product.images?.[0] || DEFAULT_IMAGES.product
            );
            setSearchValue('');
            setSelectedProductId('');
        }
    };

    const availableProducts = products.map(p => ({
        id: p.id,
        name: p.info.name,
        sku: p.sku,
        price: p.pricing.price,
        image: p.images?.[0] || DEFAULT_IMAGES.product,
    }));

    return (
        <ProductSearchDropdown
            availableProducts={availableProducts}
            selectedProductId={selectedProductId}
            onSelect={handleSelect}
            placeholder={placeholder}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            defaultProductImage={DEFAULT_IMAGES.product}
        />
    );
}
