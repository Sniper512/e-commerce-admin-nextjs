import { productService } from "@/services/productService";
import { DiscountService } from "@/services/discountService";
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
  const [product, allProducts, discounts] = await Promise.all([
    productService.getById(productId),
    productService.getAll({ isActive: true }),
    DiscountService.getAllDiscounts(),
  ]);

  // If product not found, show 404
  if (!product) {
    notFound();
  }

  // Serialize data for client component
  const serializedProduct = JSON.parse(JSON.stringify(product));
  const serializedAllProducts = JSON.parse(JSON.stringify(allProducts));
  const serializedDiscounts = JSON.parse(JSON.stringify(discounts));

  // Filter out current product from available products
  const availableProducts = serializedAllProducts.filter(
    (p: any) => p.id !== productId
  );

  return (
    <ProductEditForm
      product={serializedProduct}
      availableProducts={availableProducts}
      availableDiscounts={serializedDiscounts}
    />
  );
}
