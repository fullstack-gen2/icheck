import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    backendToken: string;
    deviceBound: boolean;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      backendToken: string;
      userId: string;
      deviceBound: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    backendToken: string;
    userId: string;
    deviceBound: boolean;
  }
}
