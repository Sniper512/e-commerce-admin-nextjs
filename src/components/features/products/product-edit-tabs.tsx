"use client";

import {
  Package,
  ShoppingCart,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag,
  History,
} from "lucide-react";

const tabs = [
  { id: "info", label: "Product Information", icon: Package },
  {
    id: "discounts",
    label: "Discounts",
    icon: () => <span className={`font-mono text-xs font-semibold`}>PKR</span>,
  },
  { id: "inventory", label: "Inventory", icon: ShoppingCart },
  { id: "multimedia", label: "Multimedia", icon: ImageIcon },
  { id: "similar", label: "Similar Products", icon: Sparkles },
  {
    id: "bought-together",
    label: "Bought Together Products",
    icon: ShoppingBag,
  },
  { id: "orders", label: "Purchase History", icon: History },
];

interface ProductEditTabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function ProductEditTabs({
  activeTab,
  onTabChange,
}: ProductEditTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
