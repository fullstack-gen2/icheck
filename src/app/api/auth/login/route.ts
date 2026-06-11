import {
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_ISSUER_URI,
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_STATE_SECRET,
  OAUTH_STATE_COOKIE,
} from "@/auth";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", OAUTH_STATE_SECRET)
    .update(value)
    .digest("base64url");
}

export function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const statePayload = base64UrlJson({
    nonce: crypto.randomUUID(),
    codeVerifier,
  });
  const state = `${statePayload}.${sign(statePayload)}`;
  const redirectUri = new URL("/api/auth/callback/keycloak", requestUrl.origin);
  const authorizationUrl = new URL(`${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/auth`);

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
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set(OAUTH_CODE_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: requestUrl.protocol === "https:",
    path: "/",
    maxAge: 600,
  });
  return response;
}
