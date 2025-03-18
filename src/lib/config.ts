export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:7001/api';

// API 响应的通用格式
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
} 