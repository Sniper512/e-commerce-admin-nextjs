// Force dynamic rendering to avoid build-time Firestore calls
export const dynamic = 'force-dynamic';

import bannerService from "@/services/bannerService";
import BannersList from "@/components/features/banners/banners-list";
import { Plus } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";



export default async function BannersPage() {
  const banners = await bannerService.getAllBanners();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-gray-600">Manage your promotional banners</p>
        </div>
        <LinkButton href="/dashboard/banners/add">
          <Plus className="mr-2 h-4 w-4" />
          Add Banner
        </LinkButton>
      </div>

      <BannersList banners={banners} />
    </div>
  );
}
