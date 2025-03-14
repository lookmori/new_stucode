import { API_BASE_URL, ApiResponse } from './config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { params, headers, ...rest } = options;
  
  // 构建 URL 和查询参数
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      ...rest,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new RequestError(response.status, data.message || '请求失败');
    }

    return data;
  } catch (error) {
    if (error instanceof RequestError) {
      throw error;
    }
    throw new RequestError(500, error instanceof Error ? error.message : '网络请求失败');
  }
}

// HTTP 方法的快捷方式
export const http = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
    
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}; 