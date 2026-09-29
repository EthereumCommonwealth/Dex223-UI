const withNextIntl = require('next-intl/plugin')();

/**
 * DEX223 Rewards is a separate app served inside this one: app.dex223.io/rewards
 * is forwarded to it, so users never leave the exchange. REWARDS_ORIGIN is that
 * app's own *.vercel.app address (production or the `public` branch), never
 * rewards.dex223.io, which redirects back here. Unset, /rewards is not served.
 */
const REWARDS_ORIGIN = process.env.REWARDS_ORIGIN?.replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    if (!REWARDS_ORIGIN) return [];
    return {
      beforeFiles: [
        { source: "/rewards", destination: `${REWARDS_ORIGIN}/rewards` },
        { source: "/rewards/:path*", destination: `${REWARDS_ORIGIN}/rewards/:path*` },
      ],
    };
  },
  webpack: config => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  transpilePackages: [
    "@repo/ui"
  ],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: true,
    domains: ['ipfs.io', 'cloudflare-ipfs.com', 'gateway.pinata.cloud'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.coingecko.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.github.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**.**',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '**',
        port: ''
      },
    ],
  },
}

module.exports = withNextIntl(nextConfig);
