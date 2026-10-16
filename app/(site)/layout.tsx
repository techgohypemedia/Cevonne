import { Suspense } from "react";
import SiteShell from "@/components/layouts/SiteShell";

export default function SiteLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <SiteShell>{children}</SiteShell>
    </Suspense>
  );
}
