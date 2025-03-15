import { API_BASE_URL, ApiResponse } from './config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T | null;
}

export class RequestError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<ResponseData<T>> {
  const url = `${API_BASE_URL}${path}`;
  
  // 获取token
  let token;
  try {
    token = localStorage.getItem('token');
  } catch (e) {
    console.error('获取token失败:', e);
    token = null;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // 如果是401错误，清除token并重定向到登录页
      if (response.status === 401) {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } catch (e) {
          console.error('清除token失败:', e);
        }
        window.location.href = '/login';
        throw new RequestError(401, '未登录或登录已过期');
      }
      throw new RequestError(response.status, `请求失败: ${response.statusText}`);
    }

    const result: ResponseData<T> = await response.json();
    return result;
  } catch (error) {
    console.error('Request error:', error);
    
    if (error instanceof RequestError) {
      throw error;
    }
    
    // 处理网络错误
    if (!navigator.onLine) {
      throw new RequestError(0, '网络已断开，请检查网络连接');
    }
    
    if (error instanceof TypeError) {
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new RequestError(0, '网络连接失败，请检查网络设置');
      }
      throw new RequestError(0, `网络错误: ${error.message}`);
    }
    
    // 其他错误
    throw new RequestError(500, error instanceof Error ? error.message : '服务器错误，请稍后重试');
  }
}

// API 请求方法
export const http = {
  get: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, data?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T = any>(path: string, data?: any, options?: RequestInit) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(path: string, options?: RequestInit) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}; 