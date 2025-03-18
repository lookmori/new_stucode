import { http } from '../request';
import { ApiResponse } from '../config';

export interface UserData {
  user_id: number;
  username: string;
  email: string;
  role_id: number;
}

export interface UserInfo {
  userId: number;
  username: string;
  email: string;
  roleId: number;
}

interface AddUserParams {
  username: string;
  email: string;
  password: string;
  role_id: number;
}

interface DeleteUserParams {
  user_id: number;
  role_id: number;
}

interface UpdateUserParams {
  operator_id: number;
  role_id: number;
  user_id: number;
  username?: string;
  password?: string;
}

interface GetUserInfoParams {
  user_id: number;
  role_id: number;
  find_id?: number;
}

export const userService = {
  // 添加教师
  addTeacher: (params: AddUserParams) => 
    http.post<UserData>('/teachers', params),
  
  // 修改教师信息
  updateTeacher: (userId: number, params: { username: string; password: string }) => 
    http.put<null>(`/teachers/${userId}`, params),
  
  // 获取教师列表
  getTeachers: () => 
    http.get<UserData[]>('/teachers'),
    
  // 添加学生
  addStudent: (params: AddUserParams) => 
    http.post<UserData>('/students', params),
    
  // 修改学生信息
  updateStudent: (userId: number, params: { username: string; password: string }) => 
    http.put<null>(`/students/${userId}`, params),
    
  // 获取学生列表
  getStudents: () => 
    http.get<UserData[]>('/students'),
    
  // 删除用户
  deleteUser: (params: DeleteUserParams) => 
    http.post<null>('/users/delete', params),
    
  // 修改用户信息
  updateUser: (params: UpdateUserParams) => 
    http.post<UserData>('/users/update', params),
    
  // 获取用户信息
  getUserInfo: (params: GetUserInfoParams) => 
    http.post<UserInfo[]>('/get-user-info', params),
}; 