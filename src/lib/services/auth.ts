import { http } from '../request';

interface LoginParams {
  email: string;
  password: string;
  role_id: number;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role_id: number;
  };
}

export const authService = {
  login: (data: LoginParams) => 
    http.post<LoginResponse>('/login', data),
}; 