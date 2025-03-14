"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProblemStatus } from "@/types/problem";
import { ProblemStatusBadge } from "@/components/problems/problem-status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { initiateCozeAuth, runWorkflow, getCozeToken } from "@/lib/coze";
import { useToast } from "@/components/ui/use-toast";
import { problemService, ProblemData } from "@/lib/services/problems";

// 修改状态选项
const statusOptions = [
  { value: "ALL", label: "全部状态" },
  { value: "1", label: "已解答" },
  { value: "0", label: "未完成" },
  { value: "-1", label: "答错" },
] as const;

// 用户角色类型
type Role = "admin" | "teacher" | "student";

interface WorkflowResult {
  code: number;
  cost: string;
  data: string;
  debug_url: string;
  msg: string;
  token: number;
}

interface Question {
  ques_name: string;
  ques_desc: string;
  ques_in: string;
  ques_out: string;
  ques_ans: string;
}

export default function ProblemsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [workflowInput, setWorkflowInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [problems, setProblems] = useState<ProblemData[]>([]);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);

  // 获取用户信息和问题列表
  useEffect(() => {
    if (!isClient) return;

    const fetchUserAndProblems = async () => {
      try {
        setIsLoadingProblems(true);
        // 从 localStorage 获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('未登录');
        }
        const user = JSON.parse(userStr);
        
        // 设置用户角色
        const roleMap: Record<number, Role> = {
          1: 'admin',
          2: 'teacher',
          3: 'student'
        };
        setUserRole(roleMap[user.role_id] || 'student');

        // 获取问题列表
        const result = await problemService.getProblems({
          user_id: user.id,
          role_id: user.role_id
        });

        if (result.code !== 200) {
          throw new Error(result.message || '获取问题列表失败');
        }

        setProblems(result.data);
      } catch (error) {
        console.error('获取问题列表失败:', error);
        toast({
          title: "获取问题列表失败",
          description: error instanceof Error ? error.message : "未知错误",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProblems(false);
      }
    };

    fetchUserAndProblems();
  }, [isClient, toast]);

  // 标记客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检查URL中的授权码
  useEffect(() => {
    if (!isClient) return;

    const code = searchParams.get("code");
    if (code) {
      console.log("收到授权码:", code);
      // 获取token
      getCozeToken(code)
        .then((tokenData) => {
          console.log("获取到token:", tokenData);
          // 保存token到localStorage
          localStorage.setItem("coze_access_token", tokenData.access_token);
          // 如果有保存的输入，恢复它
          const savedInput = localStorage.getItem("coze_workflow_input");
          if (savedInput) {
            setWorkflowInput(savedInput);
            setIsDialogOpen(true);
          }
        })
        .catch((error) => {
          console.error("获取token失败:", error);
          toast({
            title: "授权失败",
            description: "获取访问令牌失败，请重试",
            variant: "destructive",
          });
        });
    }
  }, [searchParams, toast, isClient]);

  // 检查是否为管理员
  const isAdmin = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | string>("ALL");
  const pageSize = 10;

  // 应用搜索和筛选
  const filteredProblems = problems.filter((problem) => {
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || problem.status?.toString() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalProblems = filteredProblems.length;
  const totalPages = Math.ceil(totalProblems / pageSize);

  // 重置页码当筛选条件改变时
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: typeof statusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const currentProblems = filteredProblems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleRunWorkflow = async () => {
    try {
      setIsLoading(true);
      // 检查是否有访问令牌
      const accessToken = localStorage.getItem("coze_access_token");
      
      if (!accessToken) {
        // 如果没有令牌，先进行授权
        // 保存当前的工作流输入参数
        localStorage.setItem("coze_workflow_input", workflowInput);
        initiateCozeAuth(); // 在当前页面进行授权
        return;
      }

      const result = await runWorkflow({ input: workflowInput });
      setWorkflowResult(result);
      setIsResultDialogOpen(true);
      setIsDialogOpen(false);
      setWorkflowInput("");
    } catch (error) {
      if (error instanceof Error && error.message === "No access token found") {
        // 如果是token无效，重新授权
        setIsDialogOpen(false);
        setWorkflowInput("");
        initiateCozeAuth();
        return;
      }

      toast({
        title: "工作流执行失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 解析工作流结果数据
  const parsedQuestions = useMemo(() => {
    if (!workflowResult?.data) return [];
    
    try {
      // 首先解析外层 JSON
      const parsedData = JSON.parse(workflowResult.data);
      console.log(JSON.parse(workflowResult.data),'JSON.parse(workflowResult.data)')
      // 然后解析 output 数组中的每个字符串
      const questions = parsedData.output.map((item: string) => {
        try {
          // 移除可能的转义字符
          const cleanItem = item.replace(/\\/g, '');
          console.log(cleanItem,'cleanItem')
          return JSON.parse(cleanItem);
        } catch (e) {
          console.error('解析问题数据失败:', e);
          return null;
        }
      }).filter(Boolean); // 过滤掉解析失败的项目

      // 清除 localStorage 中的数据
      localStorage.removeItem('coze_access_token');
      localStorage.removeItem('coze_workflow_input');
      localStorage.removeItem('coze_auth_state');

      return questions;
    } catch (e) {
      console.error('解析工作流结果失败:', e);
      // 即使解析失败也清除 localStorage 中的数据
      localStorage.removeItem('coze_access_token');
      localStorage.removeItem('coze_workflow_input');
      localStorage.removeItem('coze_auth_state');
      return [];
    }
  }, [workflowResult]);

  // 处理导入到数据库
  const handleImport = async () => {
    try {
      setIsImporting(true);
      console.log('准备导入的问题数据:', parsedQuestions);
      
      const result = await problemService.importProblems(parsedQuestions);
      
      if (result.code !== 0) {
        throw new Error(result.message || '导入失败');
      }
      
      toast({
        title: "导入成功",
        description: `成功导入 ${parsedQuestions.length} 个问题`,
      });
      
      // 导入成功后关闭模态框
      setIsResultDialogOpen(false);
    } catch (error) {
      console.error('导入失败:', error);
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 如果还在服务端渲染或正在加载问题列表，返回加载状态
  if (!isClient || isLoadingProblems) {
    return (
      <div className="max-w-4xl mx-auto relative min-h-screen pb-20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto relative min-h-screen pb-20">
      <h1 className="text-2xl font-bold mb-6">问题列表</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Input
            placeholder="搜索问题..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <Select
          value={statusFilter}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        {currentProblems.map((problem) => (
          <Card key={problem.problem_id} className="overflow-hidden">
            <Link
              href={`/problems/${problem.problem_id}?data=${encodeURIComponent(JSON.stringify(problem))}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground font-mono">
                  #{problem.problem_id.toString().padStart(3, '0')}
                </span>
                <span className="font-medium">{problem.title}</span>
              </div>
              {problem.status !== undefined && (
                <ProblemStatusBadge status={problem.status === 1 ? "CORRECT" : problem.status === -1 ? "WRONG" : "PENDING"} />
              )}
            </Link>
          </Card>
        ))}

        {currentProblems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {isLoadingProblems ? "加载中..." : "没有找到匹配的问题"}
          </div>
        )}
      </div>

      {totalProblems > 0 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (page === 1 || page === totalPages) return true;
                  return Math.abs(page - currentPage) <= 1;
                })
                .map((page, i, arr) => {
                  if (i > 0 && arr[i] - arr[i-1] > 1) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 悬浮按钮（仅管理员可见） */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-shadow bg-black hover:bg-gray-800"
                size="icon"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>执行 Coze 工作流</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="请输入工作流参数..."
                    value={workflowInput}
                    onChange={(e) => setWorkflowInput(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleRunWorkflow}
                    disabled={isLoading || !workflowInput.trim()}
                  >
                    {isLoading ? "执行中..." : "执行工作流"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* 结果展示模态框 */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>工作流执行结果</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {workflowResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">执行状态：</span>
                    <span className={workflowResult.code === 0 ? "text-green-600" : "text-red-600"}>
                      {workflowResult.msg}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">执行成本：</span>
                    <span>{workflowResult.cost}</span>
                  </div>
                  <div>
                    <span className="font-medium">Token 消耗：</span>
                    <span>{workflowResult.token}</span>
                  </div>
                  <div>
                    <span className="font-medium">调试链接：</span>
                    <a 
                      href={workflowResult.debug_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      查看详情
                    </a>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">生成的问题列表：</h3>
                    <Button 
                      onClick={handleImport}
                      disabled={isImporting || parsedQuestions.length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isImporting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          导入中...
                        </>
                      ) : (
                        <>导入到数据库</>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {parsedQuestions.map((question: Question, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{question.ques_name}</h4>
                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{question.ques_desc}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">输入：</span>
                              <code className="bg-muted px-2 py-1 rounded">{question.ques_in}</code>
                            </div>
                            <div>
                              <span className="font-medium">输出：</span>
                              <code className="bg-muted px-2 py-1 rounded">{question.ques_out}</code>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 