import { Suspense } from "react";
import { productService } from "@/services/productService";
import discountService from "@/services/discountService";
import categoryService from "@/services/categoryService";
import manufacturerService from "@/services/manufacturerService";
import batchService from "@/services/batchService";
import { notFound } from "next/navigation";
import { ProductEditForm } from "@/components/features/products/product-edit-form";
import { getBatchesByProductId } from "@/helpers/firestore_helper_functions/batches/get_methods/getBatchFromProductIdFromDB";
import { safeSerializeForClient } from "@/lib/firestore-utils";

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
    discountService.getByApplicableTo("products"), // Only get product-level discounts
    categoryService.getAllCategoriesWithSubCategories(),
    manufacturerService.getAllManufacturers(),
    getBatchesByProductId(productId), // Fetch batches for this product
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

  // Serialize data for client component - strip circular references and convert dates
  const serializedProduct = safeSerializeForClient(product);

  const serializedProductSearchList = safeSerializeForClient(productSearchList);
  const serializedSimilarProducts = safeSerializeForClient(similarProducts);
  const serializedBoughtTogetherProducts = safeSerializeForClient(boughtTogetherProducts);
  const serializedDiscounts = safeSerializeForClient(discounts);
  const serializedCategories = safeSerializeForClient(categories);
  const serializedManufacturers = safeSerializeForClient(manufacturers);
  const serializedBatches = safeSerializeForClient(batches);

  // Filter out current product from available products
  const availableProducts = serializedProductSearchList.filter(
    (p: any) => p.id !== productId
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductEditForm
        product={serializedProduct as any}
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
