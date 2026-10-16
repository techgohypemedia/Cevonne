"use client";

import dynamic from "next/dynamic";

const CollectionPage = dynamic(() => import("@/components/pages/CollectionPage"), {
  ssr: false,
});

export default function Page() {
  return <CollectionPage />;
}
