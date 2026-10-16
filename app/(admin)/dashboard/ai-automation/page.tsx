export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function Page() {
  redirect("/dashboard/n8n-automations");
}
