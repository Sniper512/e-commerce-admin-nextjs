// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { Suspense } from "react";
import bannerService from "@/services/bannerService";
import categoryService from "@/services/categoryService";
import { productService } from "@/services/productService";
import BannerEditForm from "@/components/features/banners/banner-edit-form";

interface BannerEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BannerEditPage({ params }: BannerEditPageProps) {
  const { id } = await params;

  // Fetch the banner
  const banner = await bannerService.getBannerById(id);

  if (!banner) {
    notFound();
  }

  // Fetch categories and products for link selection
  const categories = await categoryService.getAllCategoriesWithSubCategories();
  const { products } = await productService.getAll({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Banner</h1>
      </div>

      <Suspense fallback={<div>Loading form...</div>}>
        <BannerEditForm
          banner={banner}
          categories={categories}
          products={products}
        />
      </Suspense>
    </div>
  );
}
