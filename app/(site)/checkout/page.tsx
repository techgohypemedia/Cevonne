"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const CheckoutPage = dynamic(() => import("@/components/pages/CheckoutPage"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--accent)]" />}>
      <CheckoutPage />
    </Suspense>
  );
}
