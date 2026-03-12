/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포 최적화
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Anthropic SDK를 서버사이드 번들에서 외부 패키지로 처리
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
  },
  
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    },
  ],
};

module.exports = nextConfig;
