import { Suspense } from "react";
import ProfileLayout from "@/components/profile/ProfileLayout";

export const dynamic = "force-dynamic";

export default function Layout({ children }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-500">Loading...</div>}>
      <ProfileLayout>{children}</ProfileLayout>
    </Suspense>
  );
}
