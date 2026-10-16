"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const TrackOrderPage = dynamic(() => import("@/components/pages/TrackOrderPage"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrackOrderPage />
    </Suspense>
  );
}
