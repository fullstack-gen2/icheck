import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        deviceId: { label: "Device ID", type: "text" },
      },
      authorize: async (credentials) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            deviceId: credentials.deviceId || null,
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
});
