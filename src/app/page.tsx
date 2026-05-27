import { getServerUser } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getServerUser();

  // BFF/gateway handles all auth — no redirect to /login needed here.
  // Everyone uses the sidebar layout; role-based nav filtering shows appropriate items.
  redirect("/dashboard");
}
