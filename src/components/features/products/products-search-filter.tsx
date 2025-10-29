'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter } from 'lucide-react';

interface ProductsSearchFilterProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export function ProductsSearchFilter({ searchQuery, onSearchChange }: ProductsSearchFilterProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                        <Input
                            placeholder="Search products by name or SKU..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
