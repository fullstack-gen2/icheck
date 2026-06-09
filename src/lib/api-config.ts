export const API_URL = "/api/v1/attendance";

export const AUTH_URL = "/api/v1/auth";

export const OAUTH2_LOGIN_URL =
  process.env.NEXT_PUBLIC_LOGIN_URL ?? "/oauth2/authorization/iam_keycloak";

export const LOGOUT_URL = process.env.NEXT_PUBLIC_LOGOUT_URL ?? "/logout";
