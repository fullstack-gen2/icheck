const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "i1-c.pinimg.com" },
      // Profile photos are uploaded to Cloudflare R2 and served from its
      // public bucket host — without this next/image refuses the URL and the
      // avatar renders as a broken image.
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      // Cloudinary-hosted assets (logo, etc.).
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  turbopack: {
    root: __dirname,
  },

};

export default nextConfig;
