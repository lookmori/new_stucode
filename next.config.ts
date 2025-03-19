import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许跨域请求
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },

  // API代理配置
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:7001/api';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/:path*`,
      },
    ];
  },

  // 允许图片域名
  images: {
    domains: ['localhost'],
  },

  // 环境变量配置
  env: {
    NEXT_PUBLIC_COZE_API_BASE: process.env.NEXT_PUBLIC_COZE_API_BASE,
    NEXT_PUBLIC_COZE_CLIENT_ID: process.env.NEXT_PUBLIC_COZE_CLIENT_ID,
    NEXT_PUBLIC_COZE_CLIENT_SECRET: process.env.NEXT_PUBLIC_COZE_CLIENT_SECRET,
    NEXT_PUBLIC_COZE_REDIRECT_URI: process.env.NEXT_PUBLIC_COZE_REDIRECT_URI,
    NEXT_PUBLIC_COZE_WORKFLOW_ID: process.env.NEXT_PUBLIC_COZE_WORKFLOW_ID,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
