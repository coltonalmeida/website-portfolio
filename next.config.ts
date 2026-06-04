import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Pragmatic Content-Security-Policy. Everything is self-hosted: `next/font`
 * inlines the fonts, the GLB models live under `/models/`, and there's no
 * analytics or third-party script yet. `'unsafe-inline'` is required because the
 * app leans on styled-jsx, many `style={{}}` props, and Next's inline bootstrap
 * script; dropping it would need a nonce-based CSP (Next middleware) — a future
 * step. Dev additionally needs `'unsafe-eval'` + a `ws:` connection for HMR;
 * production gets neither.
 *
 * If a third party is ever added (Vercel Analytics, an external font/script),
 * widen `script-src`/`connect-src`/`font-src` for its domain.
 *
 * `'wasm-unsafe-eval'` is required because drei's GLB loaders decode the models
 * with a WebAssembly decoder (Draco/Meshopt); it permits WASM compilation only,
 * not general JS `eval`. `blob:` in `connect-src` covers three.js fetching the
 * decoded model/texture blobs. Dev additionally needs `'unsafe-eval'` + `ws:`
 * for HMR.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' blob: data:${isDev ? " ws:" : ""}`,
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS only takes effect over HTTPS (Vercel serves HTTPS); preload-ready.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
