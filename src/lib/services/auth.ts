import { http } from '../request';
import { cookies } from 'next/headers';

export interface RegisterData {
  email: string;
  password: string;
  role_id: number;
  code: string; // 验证码字段
}

export interface LoginData {
  email: string;
  password: string;
  role_id: number;
}

export interface LoginResponseData {
  username: string;
  email: string;
  role_id: number;
  token: string;
}

export interface LoginResponse {
  code: number;
  message: string;
  data: LoginResponseData | null;
}

export interface UserData {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
}

export interface SendCodeData {
  code: string;
  expires_in: number; // 过期时间（秒）
}

export interface CodeVerification {
  code: string;
  expiresAt: number;
}

// 设置token到cookie和localStorage
const setToken = (token: string) => {
  // 设置cookie，7天过期
  document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
  // 设置localStorage
  localStorage.setItem('token', token);
};

export const authService = {
  // 登录
  login: async (data: LoginData) => {
    try {
      const response = await http.post<LoginResponseData>('/login', data);
      if (response.code === 200 && response.data) {
        const userData = response.data;
        setToken(userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // 注册
  register: (data: RegisterData) => {
    return http.post<UserData>('/register', data);
  },

  // 发送验证码
  sendVerificationCode: (email: string) => {
    return http.post<SendCodeData>('/send-code', { email });
  },

  // 验证码是否有效
  isCodeValid: (storedVerification: CodeVerification | null, inputCode: string): boolean => {
    if (!storedVerification) return false;
    
    const now = Date.now();
    return storedVerification.code === inputCode && now < storedVerification.expiresAt;
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    try {
      const response = await http.get<UserData>('/user/current');
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response;
    } catch (error) {
      return null;
    }
  },

  // 退出登录
  logout: () => {
    // 清除 cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    // 清除 localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('email');
  },
}; 