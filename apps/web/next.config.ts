import path from 'node:path';
import type { NextConfig } from 'next';
import { DOWNLOAD } from './lib/links';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  /** This app is standalone inside the monorepo — don't trace up to sibling lockfiles. */
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async redirects() {
    const apk = DOWNLOAD.apk.trim();
    if (!apk) return [];
    return [{ source: '/orzuchat.apk', destination: apk, permanent: false }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
