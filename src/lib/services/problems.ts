import { http } from '../request';
import { ApiResponse } from '../config';

export interface ProblemData {
  problem_id: number;
  title: string;
  detail: string;
  example_input: string;
  example_output: string;
  status?: number;
  submit_count?: number;
}

interface GetProblemsParams {
  user_id: number;
  role_id: number;
}

export const problemService = {
  // 获取问题列表
  getProblems: (params: GetProblemsParams) => 
    http.post<ProblemData[]>('/problems', params),

  // 导入问题
  importProblems: (questions: any[]) => 
    http.post<null>('/problems/import', { questions }),
}; 