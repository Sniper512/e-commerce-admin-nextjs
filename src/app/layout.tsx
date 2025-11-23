import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Global error handler for unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    console.error('🚨 Stack trace:', event.reason?.stack);

    // Prevent the default browser behavior (logging to console)
    // Comment out this line if you want to see the default browser error
    // event.preventDefault();
  });

  window.addEventListener('error', (event) => {
    console.error('🚨 Unhandled Error:', event.error);
    console.error('🚨 Stack trace:', event.error?.stack);
  });
}
import { ToastProvider } from "@/components/ui/toast-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "E-Commerce Admin Dashboard",
  description: "Complete admin dashboard for e-commerce management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
