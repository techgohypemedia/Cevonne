"use client";

import dynamic from "next/dynamic";

const TrackOrderPage = dynamic(() => import("@/components/pages/TrackOrderPage"), {
  ssr: false,
});

export default function Page() {
  return <TrackOrderPage />;
}
