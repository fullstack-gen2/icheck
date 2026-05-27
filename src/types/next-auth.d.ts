import "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    /** IAM access_token — used as Bearer when calling the attendance backend. */
    backendToken: string;
    /** Internal integer user ID in the attendance database. */
    userId: string;
    /** Only relevant for student accounts; not populated from IAM OAuth2. */
    deviceBound?: boolean;
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
      deviceBound?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    backendToken: string;
    userId: string;
    deviceBound?: boolean;
  }
}
