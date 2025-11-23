/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,  // 🔒 启用TypeScript安全检查
  },
  images: {
    unoptimized: false,        // 🔒 启用图片优化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/webp', 'image/avif'], // 优化图片格式
  },
  // 🔒 限制API请求体大小和其他安全配置
  serverExternalPackages: ['@supabase/supabase-js'],
  // 🔒 添加安全头部和CORS配置
  async headers() {
    return [
      // API路由的安全配置
      {
        source: '/api/:path*',
        headers: [
          // 基本安全头部
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },

          // CORS配置
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://yourdomain.com' // 替换为实际域名
              : '*'
          },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // 24小时

          // 速率限制信息
          { key: 'X-RateLimit-Limit', value: '100' },
          { key: 'X-RateLimit-Window', value: '900' }, // 15分钟

          // API安全信息
          { key: 'X-API-Version', value: 'v1' },
          { key: 'X-Powered-By', value: 'SnapCal-Nutrition' },
        ],
      },
      // 应用程序的安全配置
      {
        source: '/(.*)',
        headers: [
          // 内容安全策略
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 允许 Vercel 调试/分析脚本加载
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co",
              "font-src 'self' https://fonts.gstatic.com",
              // 允许与 Supabase 以及 Vercel 分析上报域名建立连接
              "connect-src 'self' https://*.supabase.co https://ark.cn-beijing.volces.com wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          // 其他安全头部
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Expect-CT', value: 'max-age=86400, enforce' },
        ],
      },
    ];
  },
  // 启用严格的安全模式
  poweredByHeader: false, // 隐藏X-Powered-By头部
}

export default nextConfig
