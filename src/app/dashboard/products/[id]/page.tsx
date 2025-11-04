import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/features/products/product-edit-form";

interface ProductDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id: productId } = await params;

  // Fetch data on the server
  const [allProducts, product, discounts, categories, manufacturers] = await Promise.all([
    productService.getAll({ isPublished: true }),
    productService.getById(productId),
    discountService.getAll(),
    categoryService.getAllCategoriesWithSubCategories(),
    manufacturerService.getAllManufacturers(),
  ]);

  // If product not found, show 404
  if (!product) {
    notFound();
  }

  // Serialize data for client component
  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedAllProducts = JSON.parse(JSON.stringify(allProducts));
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedManufacturers = JSON.parse(JSON.stringify(manufacturers));

  // Filter out current product from available products
  const availableProducts = serializedAllProducts.filter(
    (p: any) => p.id !== productId
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductEditForm
        product={serializedProduct}
        availableProducts={availableProducts}
        availableDiscounts={serializedDiscounts}
        categories={serializedCategories}
        manufacturers={serializedManufacturers}
      />
    </Suspense>
  );
}
