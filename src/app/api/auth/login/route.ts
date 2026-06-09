import {
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_ISSUER_URI,
  OAUTH_STATE_COOKIE,
} from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const state = crypto.randomUUID();
  const redirectUri = new URL("/api/auth/callback/keycloak", requestUrl.origin);
  const authorizationUrl = new URL(`${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/auth`);

  // Log the exact URL we're sending the user to + the redirect_uri we're
  // registering with Keycloak. If Keycloak rejects with "Invalid parameter:
  // redirect_uri", the Vercel logs will show the value to register.
  console.log("[oauth/login] starting", {
    issuer: KEYCLOAK_ISSUER_URI,
    clientId: KEYCLOAK_CLIENT_ID,
    redirectUri: redirectUri.toString(),
  });

  authorizationUrl.searchParams.set("client_id", KEYCLOAK_CLIENT_ID);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid profile email");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri.toString());
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return response;
}
