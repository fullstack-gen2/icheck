import {
  ACCESS_TOKEN_COOKIE,
  AUTH_API_URL,
  ID_TOKEN_COOKIE,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_ISSUER_URI,
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_STATE_SECRET,
  OAUTH_STATE_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/auth";
import { ensureDeviceCookie } from "@/lib/device-cookie";
import { createHmac, timingSafeEqual } from "node:crypto";
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

function sign(value: string) {
  return createHmac("sha256", OAUTH_STATE_SECRET)
    .update(value)
    .digest("base64url");
}

function verifySignedState(state: string | null) {
  if (!state) return null;

  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      codeVerifier?: string;
    };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const signedState = verifySignedState(state);
  const savedState = getCookie(req, OAUTH_STATE_COOKIE);
  const codeVerifier = signedState?.codeVerifier ?? getCookie(req, OAUTH_CODE_VERIFIER_COOKIE);
  const isLocalhost = requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1";

  if (!code || !codeVerifier || (!signedState && !isLocalhost && (!state || !savedState || state !== savedState))) {
    console.error("[oauth/callback] state mismatch", {
      host: requestUrl.host,
      hasCode: !!code,
      hasState: !!state,
      hasSignedState: !!signedState,
      hasSavedState: !!savedState,
      hasCodeVerifier: !!codeVerifier,
      stateMatch: state === savedState,
      isLocalhost,
    });
    const response = NextResponse.redirect(new URL("/login?error=oauth_state", requestUrl.origin));
    response.cookies.delete(OAUTH_STATE_COOKIE);
    response.cookies.delete(OAUTH_CODE_VERIFIER_COOKIE);
    return response;
  }

  // Loud config sanity-check — most common cause of token_exchange failure.
  if (!KEYCLOAK_CLIENT_SECRET) {
    console.error(
      "[oauth/callback] KEYCLOAK_CLIENT_SECRET env var is empty. " +
      "If your Keycloak client is confidential, token exchange will return 401."
    );
  }

  const redirectUri = new URL("/api/auth/callback/keycloak", requestUrl.origin);
  const form = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: KEYCLOAK_CLIENT_ID,
    code,
    redirect_uri: redirectUri.toString(),
    code_verifier: codeVerifier,
  });

  const headers: HeadersInit = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (KEYCLOAK_CLIENT_SECRET) {
    headers.Authorization = `Basic ${Buffer.from(
      `${KEYCLOAK_CLIENT_ID}:${KEYCLOAK_CLIENT_SECRET}`
    ).toString("base64")}`;
  }

  const tokenUrl = `${KEYCLOAK_ISSUER_URI}/protocol/openid-connect/token`;
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: form,
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    // Read the body so Vercel logs actually tell you "invalid_client", "invalid_grant", etc.
    const body = await tokenRes.text().catch(() => "");
    let detail = "unknown";
    try {
      const parsed = JSON.parse(body) as {
        error?: string;
        error_description?: string;
      };
      detail = parsed.error_description ?? parsed.error ?? "unknown";
    } catch {
      detail = body || "unknown";
    }
    console.error("[oauth/callback] token exchange failed", {
      tokenUrl,
      status: tokenRes.status,
      body,
      clientId: KEYCLOAK_CLIENT_ID,
      hasSecret: !!KEYCLOAK_CLIENT_SECRET,
      redirectUri: redirectUri.toString(),
    });
    const errorUrl = new URL("/login", requestUrl.origin);
    errorUrl.searchParams.set("error", "token_exchange");
    errorUrl.searchParams.set("detail", detail.slice(0, 160));
    return NextResponse.redirect(errorUrl);
  }

  const token = (await tokenRes.json()) as TokenResponse;
  const response = NextResponse.redirect(new URL("/", requestUrl.origin));
  const secure = requestUrl.protocol === "https:";

  response.cookies.delete(OAUTH_STATE_COOKIE);
  response.cookies.delete(OAUTH_CODE_VERIFIER_COOKIE);
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

  // Bind/verify this browser's device for the logged-in account. Students get
  // locked to the first device they ever sign in from; if this device doesn't
  // match a previously-bound one, the backend rejects the binding and we abort
  // the login (clearing the auth cookies we just set).
  const deviceId = ensureDeviceCookie(req, response);
  try {
    const deviceRes = await fetch(`${AUTH_API_URL}/me/device`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.access_token}`,
      },
      body: JSON.stringify({ deviceId }),
      cache: "no-store",
    });

    if (deviceRes.status === 401) {
      const blocked = NextResponse.redirect(new URL("/login?error=device_mismatch", requestUrl.origin));
      blocked.cookies.delete(ACCESS_TOKEN_COOKIE);
      blocked.cookies.delete(REFRESH_TOKEN_COOKIE);
      blocked.cookies.delete(ID_TOKEN_COOKIE);
      return blocked;
    }

    if (!deviceRes.ok) {
      const body = await deviceRes.text().catch(() => "");
      console.error("[oauth/callback] device binding check failed", {
        status: deviceRes.status,
        body,
      });
    }
  } catch (e) {
    // Fail open — don't block login if the device-binding call itself errors
    // (e.g. backend briefly unreachable).
    console.error("[oauth/callback] device binding request error", e);
  }

  return response;
}
