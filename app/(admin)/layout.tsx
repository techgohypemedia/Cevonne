import { Suspense } from "react";
import AdminGuard from "@/components/auth/AdminGuard";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
