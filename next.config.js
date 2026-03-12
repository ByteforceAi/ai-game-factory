/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 배포 최적화
  reactStrictMode: true,
  poweredByHeader: false,
  
  // API Route 타임아웃 (게임 생성에 최대 60초)
  serverExternalPackages: ['@anthropic-ai/sdk'],
  
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
