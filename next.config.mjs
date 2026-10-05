import path from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const r2RemotePatterns = [
  { protocol: "https", hostname: "*.r2.dev" },
  { protocol: "https", hostname: "cdn.cevonne.com" },
  { protocol: "https", hostname: "images.unsplash.com" },
];

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const configuredSiteOrigin = process.env.FRONTEND_URL || "https://www.cevonne.com";
let siteOrigin = "https://www.cevonne.com";

try {
  siteOrigin = new URL(configuredSiteOrigin).origin;
} catch {
  // Keep the production default if the deployment environment is misconfigured.
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "connect-src 'self' https://*.supabase.co https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://cdn.jsdelivr.net https://*.jsdelivr.net https://unpkg.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com blob: data:",
  "font-src 'self' data: https: https://fonts.gstatic.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://cdn.cevonne.com https://*.r2.dev https://cdn.jsdelivr.net https://*.jsdelivr.net https://images.unsplash.com https://www.googletagmanager.com https://*.google-analytics.com",
  "media-src 'self' blob: https://cdn.cevonne.com https://*.r2.dev",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://*.jsdelivr.net https://unpkg.com https://www.googletagmanager.com https://*.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "worker-src 'self' blob: https://cdn.jsdelivr.net https://*.jsdelivr.net https://unpkg.com",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL || process.env.R2_PUBLIC_URL;

if (r2PublicBaseUrl) {
  try {
    const url = new URL(r2PublicBaseUrl);
    r2RemotePatterns.push({
      protocol: url.protocol.replace(":", ""),
      hostname: url.hostname,
    });
  } catch {
    // Ignore invalid env values; local dev can still rely on the wildcard pattern.
  }
}

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
  images: {
    remotePatterns: r2RemotePatterns,
  },
  turbopack: {
    resolveAlias: {
      "react-router-dom": "./lib/router.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-router-dom": path.resolve(projectRoot, "lib/router.tsx"),
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Access-Control-Allow-Origin", value: siteOrigin },
        ],
      },
    ];
  },
};

export default nextConfig;
