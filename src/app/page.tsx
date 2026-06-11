import { getServerUser } from "@/auth-server";
import { OAUTH2_LOGIN_URL } from "@/lib/api-config";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getServerUser();

  if (!user) redirect(OAUTH2_LOGIN_URL);
  redirect(user.role === "STUDENT" ? "/student" : "/dashboard");
}
