function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

const DEFAULT_ATTENDANCE_SERVICE_URL = "https://attendance.icheck.today";

function normalizeServiceUrl(value: string) {
  return trimTrailingSlash(value)
    .replace(/\/api\/v1\/attendance$/, "")
    .replace(/\/api\/v1$/, "");
}

function resolveServiceUrl() {
  const configured = normalizeServiceUrl(
    process.env.ATTENDANCE_SERVICE_URL ??
    process.env.BASE_API_URL ??
    process.env.BACKEND_URL ??
    DEFAULT_ATTENDANCE_SERVICE_URL
  );

  if (process.env.NODE_ENV === "production") {
    try {
      const hostname = new URL(configured).hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return DEFAULT_ATTENDANCE_SERVICE_URL;
      }
    } catch {
      return DEFAULT_ATTENDANCE_SERVICE_URL;
    }
  }

  return configured;
}

const springBootUrl = resolveServiceUrl();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        protocol: "https",
        hostname: "i1-c.pinimg.com",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/attendance/:path*",
        destination: `${springBootUrl}/api/v1/attendance/:path*`,
      },
      {
        source: "/api/v1/auth/:path*",
        destination: `${springBootUrl}/api/v1/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
