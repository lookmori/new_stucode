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
  DialogFooter,
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<ProblemData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取用户信息和问题列表
  useEffect(() => {
    if (!isClient) return;

    const fetchUserAndProblems = async () => {
      try {
        setIsLoadingProblems(true);
        // 从 localStorage 获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          // 检查是否有正在进行的Coze授权流程
          const hasCozeWorkflow = localStorage.getItem("coze_workflow_input");
          const hasCozeToken = localStorage.getItem("coze_access_token");
          
          if (hasCozeWorkflow || hasCozeToken) {
            console.log("检测到Coze工作流程，跳过登录检查");
            // 使用默认角色以避免错误
            setUserRole("admin");
            setProblems([]);
            setIsLoadingProblems(false);
            return;
          }
          
          throw new Error('未登录');
        }
        const user = JSON.parse(userStr);
        
        // 添加调试信息
        console.log('用户信息:', user);
        
        // 设置用户角色
        const roleMap: Record<number, Role> = {
          2: 'admin',
          1: 'teacher',
          0: 'student'
        };
        setUserRole(roleMap[user.role_id] || 'student');
        
        // 添加调试信息
        console.log('用户角色ID:', user.role_id);
        console.log('映射后的角色:', roleMap[user.role_id] || 'student');

        // 获取问题列表
        const result = await problemService.getProblems({
          user_id: user.user_id || user.id,
          role_id: user.role_id
        });

        if (result.code !== 200) {
          throw new Error(result.message || '获取问题列表失败');
        }

        setProblems(result.data || []);
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
          
          // 如果有保存的输入，恢复它并自动打开对话框
          const savedInput = localStorage.getItem("coze_workflow_input");
          console.log("恢复保存的输入:", savedInput);
          
          if (savedInput) {
            setWorkflowInput(savedInput);
            
            // 延迟打开对话框，确保组件已完全加载
            setTimeout(() => {
              setIsDialogOpen(true);
              console.log("打开对话框");
            }, 500);
          }
          
          // 清除URL中的授权码，但不刷新页面
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
          
          // 检查是否有保存的返回路径，如果有则立即执行工作流
          if (savedInput) {
            setTimeout(() => {
              handleRunWorkflow();
            }, 1000);
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
  
  // 添加调试信息
  useEffect(() => {
    if (isClient && userRole) {
      console.log('当前用户角色:', userRole);
      console.log('是否为管理员:', isAdmin);
    }
  }, [isClient, userRole, isAdmin]);

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
      
      // 读取已保存的输入（如果存在）
      const savedInput = localStorage.getItem("coze_workflow_input") || workflowInput;
      const currentInput = savedInput || workflowInput;
      
      if (!accessToken) {
        // 如果没有令牌，先进行授权
        // 保存当前的工作流输入参数
        localStorage.setItem("coze_workflow_input", currentInput);
        console.log("保存工作流输入并开始授权:", currentInput);
        
        // 在当前页面进行授权
        initiateCozeAuth();
        return;
      }

      console.log("开始执行工作流，输入:", currentInput);
      const result = await runWorkflow({ input: currentInput });
      console.log("工作流执行结果:", result);
      
      setWorkflowResult(result);
      setIsResultDialogOpen(true);
      setIsDialogOpen(false);
      setWorkflowInput("");
      
      // 清除保存的输入
      localStorage.removeItem("coze_workflow_input");
    } catch (error) {
      console.error("工作流执行错误:", error);
      
      if (error instanceof Error && error.message === "No access token found") {
        // 如果是token无效，重新授权
        console.log("Token无效，重新授权");
        const currentInput = localStorage.getItem("coze_workflow_input") || workflowInput;
        localStorage.setItem("coze_workflow_input", currentInput);
        setIsDialogOpen(false);
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
    if (!workflowResult?.data) {
      console.log('没有工作流结果数据');
      return [];
    }
    
    try {
      console.log('原始工作流数据:', workflowResult.data);
      console.log('数据类型:', typeof workflowResult.data);
      
      // 首先解析外层 JSON
      let parsedData;
      if (typeof workflowResult.data === 'string') {
        parsedData = JSON.parse(workflowResult.data);
      } else {
        parsedData = workflowResult.data;
      }
      console.log('解析后的工作流数据:', JSON.stringify(parsedData, null, 2));
      
      // 检查是否有output数组
      if (!parsedData.output || !Array.isArray(parsedData.output)) {
        console.error('工作流结果中没有output数组或格式不正确:', parsedData);
        return [];
      }
      
      console.log('output数组长度:', parsedData.output.length);
      
      // 验证和处理每个问题对象
      const questions = parsedData.output.map((item: any, index: number) => {
        try {
          // 验证必要字段
          if (!item || typeof item !== 'object') {
            console.error(`问题 #${index} 不是有效的对象:`, item);
            return null;
          }
          
          const requiredFields = ['ques_name', 'ques_desc'];
          const missingFields = requiredFields.filter(field => !item[field]);
          
          if (missingFields.length > 0) {
            console.error(`问题 #${index} 缺少必要字段:`, missingFields);
            return null;
          }
          
          // 返回验证过的问题对象
          return {
            ques_name: item.ques_name,
            ques_desc: item.ques_desc,
            ques_in: item.ques_in || '',
            ques_out: item.ques_out || '',
            ques_ans: item.ques_ans || '',
            ques_tag: item.ques_tag || ''
          };
        } catch (e) {
          console.error(`处理问题 #${index} 失败:`, e);
          console.error('原始数据:', item);
          return null;
        }
      }).filter(Boolean); // 过滤掉无效的问题
      
      console.log('成功解析的问题数量:', questions.length);
      console.log('解析后的问题列表:', JSON.stringify(questions, null, 2));
      
      // 清除 localStorage 中的数据
      localStorage.removeItem('coze_access_token');
      localStorage.removeItem('coze_workflow_input');
      localStorage.removeItem('coze_auth_state');

      return questions;
    } catch (e) {
      console.error('解析工作流结果失败:', e);
      console.error('原始数据:', workflowResult.data);
      
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
      if (!parsedQuestions || parsedQuestions.length === 0) {
        toast({
          title: "导入失败",
          description: "没有有效的问题数据可导入",
          variant: "destructive",
        });
        return;
      }
      
      setIsImporting(true);
      console.log('准备导入的问题数据:', parsedQuestions);
      
      // 验证每个问题的格式
      const validQuestions = parsedQuestions.filter((question: Question) => {
        const isValid = 
          question && 
          typeof question === 'object' &&
          typeof question.ques_name === 'string' && 
          typeof question.ques_desc === 'string' &&
          typeof question.ques_in === 'string' &&
          typeof question.ques_out === 'string';
          
        if (!isValid) {
          console.error('无效的问题数据:', question);
        }
        
        return isValid;
      });
      
      if (validQuestions.length === 0) {
        throw new Error('没有有效的问题数据可导入');
      }
      
      if (validQuestions.length < parsedQuestions.length) {
        console.warn(`过滤掉了 ${parsedQuestions.length - validQuestions.length} 个无效问题`);
      }
      
      // 获取用户角色ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('未登录');
      }
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查用户权限
      if (roleId !== 1 && roleId !== 2) { // 非教师或管理员
        throw new Error('权限不足，只有教师或管理员可以导入问题');
      }
      
      console.log('发送导入请求，参数:', {
        problems: validQuestions,
        role_id: roleId
      });
      
      // 调用导入API
      const result = await problemService.importProblems({
        problems: validQuestions,
        role_id: roleId
      });
      
      console.log('导入结果:', result);
      
      if (result.code !== 200) {
        throw new Error(result.message || '导入失败');
      }
      
      // 显示导入结果
      if (result.data) {
        const { imported, failed } = result.data;
        const successCount = imported?.length || 0;
        const failedCount = failed?.length || 0;
        
        let description = `成功导入 ${successCount} 个问题`;
        if (failedCount > 0) {
          description += `，${failedCount} 个问题导入失败`;
        }
        
        toast({
          title: "导入完成",
          description,
          variant: successCount > 0 ? "default" : "destructive",
          className: successCount > 0 ? "bg-green-100 border-green-400 text-black" : "bg-yellow-100 border-yellow-400 text-black",
        });
        
        // 如果有失败的问题，显示详细信息
        if (failedCount > 0) {
          console.error('导入失败的问题:', failed);
        }
      } else {
        toast({
          title: "导入成功",
          description: `成功导入问题`,
          variant: "default",
          className: "bg-green-100 border-green-400 text-black",
        });
      }
      
      // 导入成功后关闭模态框
      setIsResultDialogOpen(false);
      
      // 刷新问题列表
      window.location.reload();
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

  // 处理删除点击
  const handleDeleteClick = (problem: ProblemData, e: React.MouseEvent) => {
    e.preventDefault(); // 阻止链接导航
    e.stopPropagation(); // 阻止事件冒泡
    setProblemToDelete(problem);
    setIsDeleteConfirmOpen(true);
  };

  // 执行删除操作
  const handleDeleteConfirm = async () => {
    if (!problemToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // 获取当前用户信息
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未登录",
          className: "text-black"
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查是否为管理员
      if (roleId !== 2) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "权限不足，只有管理员可以删除问题",
          className: "text-black"
        });
        return;
      }
      
      // 调用API删除问题
      const result = await problemService.deleteProblem({
        problem_id: problemToDelete.problem_id,
        role_id: roleId
      });
      
      console.log("删除问题响应:", result);
      
      if (result.code === 200) {
        toast({
          variant: "default",
          title: "成功",
          description: result.message || "问题删除成功"
        });
        
        // 从本地数据中移除
        setProblems(prev => prev.filter(p => p.problem_id !== problemToDelete.problem_id));
        
        setIsDeleteConfirmOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "错误",
          description: result.message ?? "删除问题失败",
          className: "text-black"
        });
      }
    } catch (error) {
      console.error('删除问题失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "删除失败",
        className: "text-black"
      });
    } finally {
      setIsDeleting(false);
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
            <div className="flex w-full">
              <Link
                href={`/problems/${problem.problem_id}?data=${encodeURIComponent(JSON.stringify(problem))}`}
                className="flex-1 flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-muted-foreground font-mono">
                    #{problem.problem_id.toString().padStart(3, '0')}
                  </span>
                  <span className="font-medium">{problem.title}</span>
                  {problem.ques_tag && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {problem.ques_tag}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {problem.status !== undefined && (
                    <ProblemStatusBadge status={problem.status === 1 ? "CORRECT" : problem.status === 2 ? "WRONG" : "PENDING"} />
                  )}
                </div>
              </Link>
              {userRole === "admin" && (
                <button
                  onClick={(e) => handleDeleteClick(problem, e)}
                  className="p-4 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                  title="删除问题"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              )}
            </div>
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
      {userRole === "admin" && (
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

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>您确定要删除问题 <span className="font-bold">#{problemToDelete?.problem_id.toString().padStart(3, '0')} {problemToDelete?.title}</span> 吗？</p>
            <p className="text-sm text-muted-foreground mt-2">此操作将删除该问题的所有相关数据，且无法恢复。</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 