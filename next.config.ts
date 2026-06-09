function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeServiceUrl(value: string) {
  return trimTrailingSlash(value)
    .replace(/\/api\/v1\/attendance$/, "")
    .replace(/\/api\/v1$/, "");
}

const springBootUrl = normalizeServiceUrl(
  process.env.ATTENDANCE_SERVICE_URL ??
  process.env.BASE_API_URL ??
  process.env.BACKEND_URL ??
  "https://attendance.icheck.today"
);

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
