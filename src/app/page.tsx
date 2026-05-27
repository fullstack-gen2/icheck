import { getServerUser } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getServerUser();

  // BFF/gateway handles all auth — no redirect to /login needed here.
  // Students go to their own page; everyone else goes to dashboard.
  if (user?.role === "STUDENT") {
    redirect("/student");
  }

  redirect("/dashboard");
}
