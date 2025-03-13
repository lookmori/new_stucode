"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Problem, ProblemStatus } from "@/types/problem";
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
import { initiateCozeAuth, runWorkflow } from "@/lib/coze";
import { useToast } from "@/components/ui/use-toast";

// 模拟数据，实际项目中应该从API获取
const mockProblems: Problem[] = Array.from({ length: 50 }, (_, i) => ({
  id: `problem-${i + 1}`,
  title: `问题 ${i + 1}`,
  status: ["CORRECT", "WRONG", "PENDING"][Math.floor(Math.random() * 3)] as ProblemStatus,
  description: "",
}));

const statusOptions = [
  { value: "ALL", label: "全部状态" },
  { value: "CORRECT", label: "已解答" },
  { value: "WRONG", label: "答错" },
  { value: "PENDING", label: "未完成" },
] as const;

// 用户角色类型
type Role = "admin" | "teacher" | "student";

export default function ProblemsPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [workflowInput, setWorkflowInput] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 检查URL中的授权码
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      console.log("收到授权码:", code);
      // 如果有保存的输入，恢复它
      const savedInput = localStorage.getItem("coze_workflow_input");
      if (savedInput) {
        setWorkflowInput(savedInput);
        setIsDialogOpen(true);
      }
    }
  }, [searchParams]);

  // 当前用户角色（模拟数据）
  const userRole: Role = "admin";
  
  // 检查是否为管理员
  const isAdmin = userRole === "admin";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProblemStatus>("ALL");
  const pageSize = 10;

  // 应用搜索和筛选
  const filteredProblems = mockProblems.filter((problem) => {
    const matchesSearch = problem.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || problem.status === statusFilter;
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
      const accessToken = typeof window !== "undefined" ? localStorage.getItem("coze_access_token") : null;
      
      if (!accessToken) {
        // 如果没有令牌，先进行授权
        // 保存当前的工作流输入参数
        if (typeof window !== "undefined") {
          localStorage.setItem("coze_workflow_input", workflowInput);
        }
        initiateCozeAuth(); // 在当前页面进行授权
        return;
      }

      const result = await runWorkflow({ input: workflowInput });
      
      if (result.success) {
        toast({
          title: "工作流执行成功",
          description: result.data || "请查看执行结果",
        });
        setIsDialogOpen(false);
        setWorkflowInput("");
      } else {
        throw new Error(result.message || "执行失败");
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Local storage is not available") {
        // 处理服务端渲染的情况
        return;
      }
      
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
          <Card key={problem.id} className="overflow-hidden">
            <Link
              href={`/problems/${problem.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <span className="text-muted-foreground font-mono">
                  #{problem.id.split('-')[1].padStart(3, '0')}
                </span>
                <span className="font-medium">{problem.title}</span>
              </div>
              <ProblemStatusBadge status={problem.status} />
            </Link>
          </Card>
        ))}

        {currentProblems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            没有找到匹配的问题
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
    </div>
  );
} 