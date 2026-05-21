import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getDeviceId } from "@/lib/device-cookie";

const BASE_API_URL = process.env.BASE_API_URL ?? "http://localhost:8090";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // NB: do NOT set `basePath` here. Next.js's own `basePath: "/attendance"`
  // (next.config.ts) strips that prefix BEFORE the request reaches the auth
  // handler, so internally the URL is already `/api/auth/...` — which is
  // exactly NextAuth's default. Setting `/attendance/api/auth` here would
  // cause UnknownAction because the substring wouldn't match.
  // The client (SessionProvider) still needs the full `/attendance/api/auth`
  // because the browser hits the public URL with the Next.js prefix.
  providers: [
    Credentials({
      // No deviceId here — it lives in an HttpOnly cookie and is read
      // server-side from the incoming request.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        // Read the device id from the HttpOnly cookie rather than trusting
        // the client to pass it in — clients can't read it, can't forge it.
        const deviceId = await getDeviceId();

        const res = await fetch(`${BASE_API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            deviceId: deviceId,
          }),
        });

        if (!res.ok) return null;

        const json = await res.json();
        const data = json?.payload; // backend wraps in ApiResponse { success, message, payload }
        if (!data?.token) return null;

        return {
          id: String(data.userId),
          name: data.fullName,
          email: String(credentials.email),
          role: data.role as string,
          backendToken: data.token as string,
          deviceBound: data.deviceBound as boolean,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.backendToken = user.backendToken;
        token.userId = user.id;
        token.deviceBound = user.deviceBound;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as string;
      session.user.backendToken = token.backendToken as string;
      session.user.userId = token.userId as string;
      session.user.deviceBound = token.deviceBound as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  // Pin cookie path to "/" so the session cookie is sent to every route in
  // the app (e.g. /attendance/api/settings), regardless of where NextAuth's
  // own endpoints are mounted. Without this, a basePath misconfiguration can
  // scope the cookie to /api/auth and break every other proxy with 401.
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.session-token"
          : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
