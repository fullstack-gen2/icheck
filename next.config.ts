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
  // NOTE: `/api/v1/*` is handled by `src/app/api/v1/[...path]/route.ts`, which
  // proxies to the attendance-service backend AND attaches the
  // `Authorization: Bearer <token>` header from the httpOnly access-token
  // cookie (the backend ignores cookies — it's an OAuth2 resource server that
  // only reads the bearer token). A plain `rewrites()` proxy can't add that
  // header, which previously caused every RTK Query call to fail with 401.
};

export default nextConfig;
