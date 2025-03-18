import { http } from '../request';

export interface SubmitAnswerData {
  user_id: number;
  role_id: number;
  problem_id: number;
  student_answer: string;
  problem_desc?: string;
}

export interface SubmitAnswerResponse {
  problem_id: number;
  status: number;
  is_correct: boolean;
}

export const problemService = {
  // 提交答案
  submitAnswer: (data: SubmitAnswerData) => {
    return http.post<SubmitAnswerResponse>('/problems/submit', data);
  },
}; 