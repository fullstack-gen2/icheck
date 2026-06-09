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

function logout(req: Request) {
  const requestUrl = new URL(req.url);
  const logoutUrl = new URL(`${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("client_id", KEYCLOAK_CLIENT_ID);
  logoutUrl.searchParams.set("post_logout_redirect_uri", new URL("/login", requestUrl.origin).toString());

  const response = NextResponse.redirect(logoutUrl);
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(ID_TOKEN_COOKIE);
  return response;
}
