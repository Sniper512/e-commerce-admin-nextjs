"use client";

import { useRouter } from "next/navigation";
import type { Banner } from "@/types";
import bannerService from "@/services/bannerService";
import { LinkButton } from "@/components/ui/link-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/toast-context";
import Image from "next/image";

interface BannersListProps {
  banners: Banner[];
}

export default function BannersList({ banners }: BannersListProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleToggleStatus = async (
    bannerId: string,
    currentStatus: boolean,
    bannerType: string
  ) => {
    try {
      await bannerService.toggleActiveStatus(bannerId);
      showToast("success", "Banner status updated successfully!");
      router.refresh();
    } catch (error: any) {
      showToast("error", "Failed to update banner status", error.message || "Unknown error");
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredBanners = banners.filter((banner) =>
    banner.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2  text-gray-500" />
            <Input
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      {filteredBanners.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No banners found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Link Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell className="font-medium">
                      {banner.displayOrder}
                    </TableCell>
                    <TableCell>
                      {banner.imageUrl ? (
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="h-12 w-20 object-contain"
                          width={80}
                          height={48}
                        />
                      ) : (
                        <div className="h-12 w-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{banner.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {banner.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          banner.bannerType === "popup" ? "warning" : "default"
                        }>
                        {banner.bannerType}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {banner.linkType}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(
                            banner.id,
                            banner.isActive,
                            banner.bannerType
                          )
                        }>
                        <Badge
                          variant={banner.isActive ? "success" : "secondary"}>
                          {banner.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <LinkButton
                          href={`/dashboard/banners/${banner.id}`}
                          variant="outline"
                          size="sm">
                          <Eye className="h-3 w-3" />
                        </LinkButton>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(
                              banner.id,
                              banner.isActive,
                              banner.bannerType
                            )
                          }
                          title={banner.isActive ? "Disable Banner" : "Enable Banner"}>
                          {banner.isActive ? (
                            <ToggleRight className="h-3 w-3" />
                          ) : (
                            <ToggleLeft className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
