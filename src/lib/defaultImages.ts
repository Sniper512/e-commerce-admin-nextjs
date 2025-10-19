/**
 * Default images for the application
 * Use these constants whenever you need to display fallback images
 */

export const DEFAULT_IMAGES = {
	product: "/images/default-product.svg",
	category: "/images/default-category.svg",
	user: "/images/default-user.svg",
	brand: "/images/default-brand.svg",
} as const;

/**
 * Helper function to get image source with fallback
 * @param imageUrl - The primary image URL
 * @param type - The type of default image to use as fallback
 * @returns The image URL or the default image
 */
export const getImageWithFallback = (
	imageUrl: string | undefined | null,
	type: keyof typeof DEFAULT_IMAGES = "product"
): string => {
	return imageUrl || DEFAULT_IMAGES[type];
};

/**
 * Props for image error handler
 * Use this in onError handler: onError={handleImageError('product')}
 */
export const handleImageError = (
	type: keyof typeof DEFAULT_IMAGES = "product"
) => {
	return (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		e.currentTarget.src = DEFAULT_IMAGES[type];
	};
};
