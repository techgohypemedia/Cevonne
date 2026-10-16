"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const CartPage = dynamic(() => import("@/components/pages/CartPage"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--accent)]" />}>
      <CartPage />
    </Suspense>
  );
}
