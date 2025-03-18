import { http } from '../request';
import { ApiResponse } from '../config';
import { ResponseData } from '../request';

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

interface ImportProblemParams {
  problems: {
    ques_name: string;
    ques_desc: string;
    ques_in: string;
    ques_out: string;
    ques_ans?: string;
  }[];
  role_id: number;
}

interface ImportProblemResult {
  imported?: {
    problem_id: number;
    title: string;
  }[];
  failed?: {
    title: string;
    error: string;
  }[];
}

interface DeleteProblemParams {
  problem_id: number;
  role_id: number;
}

export const problemService = {
  // 获取问题列表
  getProblems: (params: GetProblemsParams) => 
    http.post<ProblemData[]>('/problems', params),

  // 导入问题
  importProblems: (params: ImportProblemParams) => 
    http.post<ImportProblemResult>('/problems/import', params),

  // 删除问题
  deleteProblem: (params: DeleteProblemParams) => 
    http.post<ResponseData<null>>('/problems/delete', params),
}; 