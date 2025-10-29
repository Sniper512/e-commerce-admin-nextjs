'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus, Upload, Image as ImageIcon } from 'lucide-react';
import type { ProductImage } from '@/types';

interface ProductMultimediaTabProps {
    images: ProductImage[];
    onImagesChange: (value: ProductImage[]) => void;
}

export function ProductMultimediaTab({ images, onImagesChange }: ProductMultimediaTabProps) {
    const addImageUrl = () => {
        onImagesChange([
            ...images,
            {
                id: crypto.randomUUID(),
                url: '',
                altText: '',
                isPrimary: images.length === 0,
                sortOrder: images.length,
            },
        ]);
    };

    const removeImage = (id: string) => {
        onImagesChange(images.filter((img) => img.id !== id));
    };

    const updateImage = (
        id: string,
        field: 'url' | 'altText' | 'isPrimary' | 'sortOrder',
        value: string | boolean | number
    ) => {
        const updated = images.map((img) => {
            if (img.id === id) {
                if (field === 'isPrimary' && value === true) {
                    // Make this primary and unset others
                    return { ...img, [field]: value };
                }
                return { ...img, [field]: value };
            } else if (field === 'isPrimary' && value === true) {
                // Unset isPrimary on other images
                return { ...img, isPrimary: false };
            }
            return img;
        });
        onImagesChange(updated);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        Product Images
                        <Button onClick={addImageUrl} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Image
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="flex items-center gap-4 p-3 border rounded-lg"
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <ImageIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Image URL"
                                        value={image.url}
                                        onChange={(e) => updateImage(image.id, 'url', e.target.value)}
                                    />
                                    <Input
                                        placeholder="Alt text"
                                        value={image.altText}
                                        onChange={(e) =>
                                            updateImage(image.id, 'altText', e.target.value)
                                        }
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={image.isPrimary}
                                            onChange={(e) =>
                                                updateImage(image.id, 'isPrimary', e.target.checked)
                                            }
                                        />
                                        <Label className="text-sm">Primary Image</Label>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => removeImage(image.id)}
                                    variant="ghost"
                                    size="sm"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600">Drag & drop images here or click to upload</p>
                            <Button variant="outline" size="sm" className="mt-2">
                                Choose Files
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Videos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="form-group">
                            <Label htmlFor="videoUrl" className="form-label">
                                Video URL
                            </Label>
                            <Input id="videoUrl" placeholder="https://youtube.com/watch?v=..." />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="videoTitle" className="form-label">
                                Video Title
                            </Label>
                            <Input id="videoTitle" placeholder="Product demo video" />
                        </div>

                        <div className="form-group">
                            <Label htmlFor="videoDesc" className="form-label">
                                Video Description
                            </Label>
                            <textarea
                                id="videoDesc"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Describe the video content"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
