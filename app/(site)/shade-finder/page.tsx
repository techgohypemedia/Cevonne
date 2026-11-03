"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const ShadeQuizPage = dynamic(() => import("@/components/pages/ShadeQuizPage"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5]" />}>
      <ShadeQuizPage />
    </Suspense>
  );
}

