import { productService } from "@/services/productService";
import BannerAddForm from "@/components/features/banners/banner-add-form";

export default async function AddBannerPage() {
  // Fetch categories and products for link selection
  const { products } = await productService.getAll({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Add New Banner</h1>
      </div>

      <BannerAddForm products={products} />
    </div>
  );
}
