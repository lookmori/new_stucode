export type ProblemStatus = 'CORRECT' | 'WRONG' | 'PENDING';

export interface Problem {
  id: string;
  title: string;
  status: ProblemStatus;
  description: string;
  sampleInput?: string;
  sampleOutput?: string;
}

export interface ProblemListResponse {
  problems: Problem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProblemSubmission {
  problemId: string;
  code: string;
  language: string;
} 