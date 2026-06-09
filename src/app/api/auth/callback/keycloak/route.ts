import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_ISSUER_URI,
  OAUTH_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
}

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const savedState = getCookie(req, OAUTH_STATE_COOKIE);

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(new URL("/login?error=oauth_state", requestUrl.origin));
  }

  const redirectUri = new URL("/api/auth/callback/keycloak", requestUrl.origin);
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: redirectUri.toString(),
  });

  if (KEYCLOAK_CLIENT_SECRET) {
    form.set("client_secret", KEYCLOAK_CLIENT_SECRET);
  }

  const tokenRes = await fetch(`${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", requestUrl.origin));
  }

  const token = (await tokenRes.json()) as TokenResponse;
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));
  const secure = requestUrl.protocol === "https:";

  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.set(ACCESS_TOKEN_COOKIE, token.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: token.expires_in ?? 300,
  });

  if (token.refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, token.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: token.refresh_expires_in ?? 1800,
    });
  }

  if (token.id_token) {
    response.cookies.set(ID_TOKEN_COOKIE, token.id_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: token.expires_in ?? 300,
    });
  }

  return response;
}
