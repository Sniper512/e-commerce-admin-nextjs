'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    AlertTriangle,
    FileText,
    Layers,
    Calendar,
    MessageSquare,
    TrendingUp,
    Warehouse
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Products',
        icon: Package,
        items: [
            { title: 'All Products', href: '/dashboard/products' },
            { title: 'Add Product', href: '/dashboard/products/add' },
            { title: 'Categories', href: '/dashboard/categories' },
            { title: 'Discounts', href: '/dashboard/discounts' },
            { title: 'Batches', href: '/dashboard/batches' },
            { title: 'Cartons', href: '/dashboard/cartons' },
        ],
    },
    {
        title: 'Inventory',
        icon: Warehouse,
        items: [
            { title: 'Stock Management', href: '/dashboard/inventory' },
            { title: 'Low Stock Alerts', href: '/dashboard/inventory/alerts' },
            { title: 'Expiry Tracking', href: '/dashboard/inventory/expiry' },
        ],
    },
    {
        title: 'Orders',
        icon: ShoppingCart,
        items: [
            { title: 'All Orders', href: '/dashboard/orders' },
            { title: 'Create Order', href: '/dashboard/orders/create' },
            { title: 'Refunds', href: '/dashboard/orders/refunds' },
        ],
    },
    {
        title: 'Customers',
        icon: Users,
        items: [
            { title: 'All Customers', href: '/dashboard/customers' },
            { title: 'Reviews', href: '/dashboard/customers/reviews' },
        ],
    },
    {
        title: 'Payments',
        icon: CreditCard,
        items: [
            { title: 'All Payments', href: '/dashboard/payments' },
            { title: 'Payment Methods', href: '/dashboard/payments/methods' },
            { title: 'Ledger', href: '/dashboard/payments/ledger' },
            { title: 'Expenses', href: '/dashboard/payments/expenses' },
        ],
    },
    {
        title: 'Promotions',
        icon: Tag,
        items: [
            { title: 'Discounts', href: '/dashboard/promotions/discounts' },
            { title: 'Promo Codes', href: '/dashboard/promotions/codes' },
        ],
    },
    {
        title: 'Banners',
        href: '/dashboard/banners',
        icon: ImageIcon,
    },
    {
        title: 'Notifications',
        href: '/dashboard/notifications',
        icon: Bell,
    },
    {
        title: 'Analytics',
        icon: BarChart3,
        items: [
            { title: 'Overview', href: '/dashboard/analytics' },
            { title: 'Sales Report', href: '/dashboard/analytics/sales' },
            { title: 'Product Performance', href: '/dashboard/analytics/products' },
            { title: 'Customer Insights', href: '/dashboard/analytics/customers' },
        ],
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [openMenus, setOpenMenus] = React.useState<string[]>(['Products']);

    const toggleMenu = (title: string) => {
        setOpenMenus(prev =>
            prev.includes(title)
                ? prev.filter(item => item !== title)
                : [...prev, title]
        );
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center border-b border-gray-200 px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                            E
                        </div>
                        <span className="text-xl font-bold">E-Commerce</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href ? pathname === item.href : false;
                            const hasSubmenu = !!item.items;
                            const isOpen = openMenus.includes(item.title);

                            if (hasSubmenu) {
                                return (
                                    <li key={item.title}>
                                        <button
                                            onClick={() => toggleMenu(item.title)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                                'hover:bg-gray-100',
                                                isOpen && 'bg-gray-50'
                                            )}
                                        >
                                            <Icon className="h-5 w-5 text-gray-500" />
                                            <span className="flex-1 text-left">{item.title}</span>
                                            <svg
                                                className={cn(
                                                    'h-4 w-4 text-gray-500 transition-transform',
                                                    isOpen && 'rotate-90'
                                                )}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
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
                                                                    'block rounded-lg px-3 py-2 text-sm transition-colors',
                                                                    isSubActive
                                                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                                                        : 'text-gray-700 hover:bg-gray-100'
                                                                )}
                                                            >
                                                                {subItem.title}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            }

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href!}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                            isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        )}
                                    >
                                        <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
                                        {item.title}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
        </aside>
    );
}
