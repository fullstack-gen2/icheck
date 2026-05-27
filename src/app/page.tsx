import { getServerUser } from "@/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "STUDENT") {
    redirect("/student");
  }

  redirect("/dashboard");
}
