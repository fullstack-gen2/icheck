import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_ISSUER_URI,
  REFRESH_TOKEN_COOKIE,
} from "@/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return logout(req);
}

export async function POST(req: Request) {
  return logout(req);
}

function getCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function logout(req: Request) {
  const requestUrl = new URL(req.url);
  const logoutUrl = new URL(`${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/logout`);
  const idToken = getCookie(req, ID_TOKEN_COOKIE);

  logoutUrl.searchParams.set("client_id", KEYCLOAK_CLIENT_ID);
  logoutUrl.searchParams.set("post_logout_redirect_uri", new URL("/login?logged_out=1", requestUrl.origin).toString());
  if (idToken) {
    logoutUrl.searchParams.set("id_token_hint", idToken);
  }

  const response = NextResponse.redirect(logoutUrl);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(ID_TOKEN_COOKIE);
  return response;
}
