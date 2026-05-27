import NextAuth from "next-auth";

// Server-side base URL for the attendance backend.
// In production this is the internal Docker service name so the jwt()
// callback can resolve the internal integer userId right after OAuth login.
const BASE_API_URL =
  process.env.BASE_API_URL ?? "http://attendance-service:8090";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    {
      id: "istad-iam",
      name: "ISTAD IAM",
      // type: "oidc" → NextAuth auto-discovers endpoints from
      //   https://iam.istad.co/.well-known/openid-configuration
      type: "oidc",
      issuer: "https://iam.istad.co",
      clientId: process.env.IAM_CLIENT_ID!,
      clientSecret: process.env.IAM_CLIENT_SECRET!,
      authorization: { params: { scope: "openid profile email" } },
      checks: ["pkce", "state"],
      profile(profile: Record<string, unknown>) {
        const roles = profile.roles as string[] | undefined;
        return {
          id: profile.sub as string,
          name: (profile.name ??
            profile.preferred_username ??
            profile.sub) as string,
          email: (profile.email ?? "") as string,
          image: (profile.picture ?? null) as string | null,
          role:
            roles?.[0] ??
            (profile.role as string | undefined) ??
            "USER",
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      // Only runs on the first sign-in (when account is present)
      if (account?.access_token) {
        token.backendToken = account.access_token;

        // Resolve the internal integer userId from the attendance backend.
        // The backend's /me endpoint reads the email claim from the IAM JWT
        // and returns the matching User record.
        try {
          const res = await fetch(`${BASE_API_URL}/api/v1/users/me`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
            cache: "no-store",
          });
          if (res.ok) {
            const json = await res.json();
            const id = json?.payload?.id;
            if (id != null) token.userId = String(id);
          }
        } catch {
          // Non-fatal — userId will be undefined for users not yet in the DB
        }
      }

      if (profile) {
        const p = profile as Record<string, unknown>;
        const roles = p.roles as string[] | undefined;
        token.role =
          roles?.[0] ??
          (p.role as string | undefined) ??
          (token.role as string | undefined);
      }

      return token;
    },

    session({ session, token }) {
      session.user.role = (token.role as string) ?? "USER";
      session.user.backendToken = token.backendToken as string;
      session.user.userId = (token.userId as string) ?? "";
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: { strategy: "jwt" },

  // Pin the session cookie path to "/" so it is sent on every route,
  // regardless of the Next.js basePath ("/attendance").
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
