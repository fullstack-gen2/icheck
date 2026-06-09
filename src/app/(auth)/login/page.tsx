import { OAUTH2_LOGIN_URL } from "@/lib/api-config";
import { redirect } from "next/navigation";

export default function LoginPage() {
  redirect(OAUTH2_LOGIN_URL);
}
