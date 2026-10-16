import { Suspense } from "react";
import ArRouteShell from "@/components/layouts/ArRouteShell";

export const dynamic = "force-dynamic";

export default function ArLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading AR...</div>}>
      <ArRouteShell>{children}</ArRouteShell>
    </Suspense>
  );
}
