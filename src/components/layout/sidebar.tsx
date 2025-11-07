"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Tag,
  Image as ImageIcon,
  Bell,
  Settings,
  Warehouse,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Catalog",
    icon: Package,
    items: [
      { title: "Products", href: "/dashboard/products" },
      { title: "Categories", href: "/dashboard/categories" },
      { title: "Manufacturers", href: "/dashboard/manufacturers" },
      { title: "Batches", href: "/dashboard/batches" },
      { title: "Discounts", href: "/dashboard/discounts" },
    ],
  },
  {
    title: "Inventory",
    icon: Warehouse,
    items: [
      { title: "Stock Management", href: "/dashboard/inventory" },
      { title: "Low Stock Alerts", href: "/dashboard/inventory/alerts" },
      { title: "Expiry Tracking", href: "/dashboard/inventory/expiry" },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    items: [
      { title: "All Orders", href: "/dashboard/orders" },
      { title: "Create Order", href: "/dashboard/orders/create" },
      { title: "Refunds", href: "/dashboard/orders/refunds" },
    ],
  },
  {
    title: "Customers",
    icon: Users,
    items: [
      { title: "All Customers", href: "/dashboard/customers" },
      { title: "Reviews", href: "/dashboard/customers/reviews" },
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    items: [
      { title: "All Payments", href: "/dashboard/payments" },
      { title: "Payment Methods", href: "/dashboard/payments/methods" },
      { title: "Ledger", href: "/dashboard/payments/ledger" },
      { title: "Expenses", href: "/dashboard/payments/expenses" },
    ],
  },
  {
    title: "Promotions",
    icon: Tag,
    items: [
      { title: "Discounts", href: "/dashboard/promotions/discounts" },
      { title: "Promo Codes", href: "/dashboard/promotions/codes" },
    ],
  },
  {
    title: "Banners",
    href: "/dashboard/banners",
    icon: ImageIcon,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Analytics",
    icon: BarChart3,
    items: [
      { title: "Overview", href: "/dashboard/analytics" },
      { title: "Sales Report", href: "/dashboard/analytics/sales" },
      { title: "Product Performance", href: "/dashboard/analytics/products" },
      { title: "Customer Insights", href: "/dashboard/analytics/customers" },
    ],
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = React.useState<string[]>(["Products"]);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [hoveredMenu, setHoveredMenu] = React.useState<string | null>(null);
  const [popoverPosition, setPopoverPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Ensure we're on the client side for portal
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Load minimized state from localStorage on mount
  React.useEffect(() => {
    const savedState = localStorage.getItem("sidebarMinimized");
    if (savedState) {
      setIsMinimized(savedState === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem("sidebarMinimized", String(newState));
    // Dispatch custom event to notify layout
    window.dispatchEvent(new Event("sidebarToggle"));
  };

  const toggleMenu = (title: string) => {
    if (isMinimized) return; // Don't toggle in minimized mode
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const handleMouseEnter = (
    e: React.MouseEvent<HTMLDivElement>,
    title: string
  ) => {
    // Clear any pending close timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPosition({
      top: rect.top,
      left: rect.right,
    });
    setHoveredMenu(title);
  };

  const handleMouseLeave = () => {
    // Delay closing to allow mouse to move to popover
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredMenu(null);
      setPopoverPosition(null);
    }, 150);
  };

  const handlePopoverEnter = () => {
    // Cancel the close timeout when entering popover
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handlePopoverLeave = () => {
    // Close immediately when leaving popover
    setHoveredMenu(null);
    setPopoverPosition(null);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300",
        isMinimized ? "w-16" : "w-48"
      )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-4 justify-between">
          {!isMinimized && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                E
              </div>
              <span className="text-xl font-bold">E-Commerce</span>
            </Link>
          )}
          {isMinimized && (
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                E
              </div>
            </Link>
          )}
        </div>

        {/* Toggle Button */}
        <div className="flex items-center justify-end px-2 py-2 border-b border-gray-200">
          <button
            onClick={toggleSidebar}
            className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}>
            {isMinimized ? (
              <ChevronRight className="h-6 w-6 text-gray-600" />
            ) : (
              <ChevronLeft className="h-6 w-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href ? pathname === item.href : false;
              const hasSubmenu = !!item.items;
              const isOpen = openMenus.includes(item.title);
              const isHovered = hoveredMenu === item.title;

              if (hasSubmenu) {
                return (
                  <li key={item.title} className="relative">
                    {isMinimized ? (
                      <div
                        onMouseEnter={(e) => handleMouseEnter(e, item.title)}
                        onMouseLeave={handleMouseLeave}>
                        <button
                          className={cn(
                            "flex w-full items-center justify-center rounded-lg p-3 text-sm font-medium transition-colors",
                            "hover:bg-gray-100",
                            isHovered && "bg-gray-50"
                          )}
                          title={item.title}>
                          <Icon className="h-5 w-5 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleMenu(item.title)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            "hover:bg-gray-100",
                            isOpen && "bg-gray-50"
                          )}>
                          <Icon className="h-5 w-5 text-gray-500" />
                          <span className="flex-1 text-left">{item.title}</span>
                          <svg
                            className={cn(
                              "h-4 w-4 text-gray-500 transition-transform",
                              isOpen && "rotate-90"
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                        {isOpen && (
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.items?.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <li key={subItem.href}>
                                  <Link
                                    href={subItem.href}
                                    className={cn(
                                      "block rounded-lg px-3 py-2 text-sm transition-colors",
                                      isSubActive
                                        ? "bg-blue-50 text-blue-600 font-medium"
                                        : "text-gray-700 hover:bg-gray-100"
                                    )}>
                                    {subItem.title}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center rounded-lg p-3 text-sm font-medium transition-colors",
                      isMinimized ? "justify-center" : "gap-3 px-3 py-2",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    title={isMinimized ? item.title : undefined}>
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-500"
                      )}
                    />
                    {!isMinimized && item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Popover Menu Portal - Rendered outside sidebar */}
      {mounted &&
        isMinimized &&
        hoveredMenu &&
        popoverPosition &&
        createPortal(
          <div
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handlePopoverLeave}
            className="fixed w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-2 z-50"
            style={{
              top: `${popoverPosition.top}px`,
              left: `${popoverPosition.left}px`,
            }}>
            <div className="px-3 py-2 text-sm font-semibold text-gray-900 border-b border-gray-100">
              {hoveredMenu}
            </div>
            <ul className="py-1">
              {menuItems
                .find((item) => item.title === hoveredMenu)
                ?.items?.map((subItem) => {
                  const isSubActive = pathname === subItem.href;
                  return (
                    <li key={subItem.href}>
                      <Link
                        href={subItem.href}
                        className={cn(
                          "block px-3 py-2 text-sm transition-colors",
                          isSubActive
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        )}>
                        {subItem.title}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>,
          document.body
        )}
    </aside>
  );
}
