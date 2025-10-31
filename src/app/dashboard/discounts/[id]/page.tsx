import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import { DiscountService } from "@/services/discountService";
import { notFound } from "next/navigation";
import { DiscountForm } from "@/components/features/discounts/discount-form";

interface DiscountDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DiscountDetailPage({
  params,
}: DiscountDetailPageProps) {
  const { id } = await params;

  // Fetch data on the server
  const [discount, categories, products] = await Promise.all([
    DiscountService.getDiscountById(id),
    categoryService.getAllCategories(),
    productService.getAll({ isActive: true }),
  ]);

  // If discount not found, show 404
  if (!discount) {
    notFound();
  }

  // Serialize data for client component
  const serializedDiscount = JSON.parse(JSON.stringify(discount));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <DiscountForm
      discount={serializedDiscount}
      categories={serializedCategories}
      products={serializedProducts}
    />
  );
}
