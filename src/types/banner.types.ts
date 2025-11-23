export interface Banner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  bannerType: "popup" | "homepage";
  linkType: "category" | "product";
  link: string; // Could be categoryId or productId based on linkType
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
}
