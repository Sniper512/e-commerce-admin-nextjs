"use client";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorageChange = () => {
      const minimized = localStorage.getItem("sidebarMinimized") === "true";
      setIsMinimized(minimized);
    };

    // Initial load
    handleStorageChange();

    // Listen for changes
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sidebarToggle", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sidebarToggle", handleStorageChange);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          isMinimized ? "pl-16" : "pl-48"
        }`}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
