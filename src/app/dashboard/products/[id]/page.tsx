import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import batchService from "@/services/batchService";
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
  const [
    productSearchList,
    product,
    discounts,
    categories,
    manufacturers,
    batches,
  ] = await Promise.all([
    productService.getProductSearchList(), // Lightweight: only id, name, first image
    productService.getById(productId),
    discountService.getAll(),
    categoryService.getAllCategoriesWithSubCategories(),
    manufacturerService.getAllManufacturers(),
    batchService.getBatchesByProductId(productId), // Fetch batches for this product
  ]);

  // If product not found, show 404
  if (!product) {
    notFound();
  }

  // Get populated data for similar and bought-together products
  const [similarProducts, boughtTogetherProducts] = await Promise.all([
    productService.getProductsByIds(product.similarProductIds || []),
    productService.getProductsByIds(product.boughtTogetherProductIds || []),
  ]);

  // Serialize data for client component
  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedProductSearchList = JSON.parse(
    JSON.stringify(productSearchList)
  );
  const serializedSimilarProducts = JSON.parse(JSON.stringify(similarProducts));
  const serializedBoughtTogetherProducts = JSON.parse(
    JSON.stringify(boughtTogetherProducts)
  );
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedManufacturers = JSON.parse(JSON.stringify(manufacturers));
  const serializedBatches = JSON.parse(JSON.stringify(batches));

  // Filter out current product from available products
  const availableProducts = serializedProductSearchList.filter(
    (p: any) => p.id !== productId
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductEditForm
        product={serializedProduct}
        availableProducts={availableProducts}
        similarProducts={serializedSimilarProducts}
        boughtTogetherProducts={serializedBoughtTogetherProducts}
        availableDiscounts={serializedDiscounts}
        categories={serializedCategories}
        manufacturers={serializedManufacturers}
        batches={serializedBatches}
      />
    </Suspense>
  );
}
