"use client";

import React, { Suspense } from "react";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ShopProvider } from "@/context/ShopContext";
import ScrollToTop from "@/components/ScrollToTop";

// Suppress false-positive React 19 / Next.js warning for next-themes inline script
if (process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    originalError.apply(console, args);
  };
}

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LanguageProvider>
        <ShopProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <ScrollToTop />
              {children}
            </Suspense>
            <Toaster position="top-center" richColors closeButton />
          </AuthProvider>
        </ShopProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
