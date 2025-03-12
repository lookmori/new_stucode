"use client";

import { useState } from "react";
import Link from "next/link";
import { Problem, ProblemStatus } from "@/types/problem";
import { ProblemStatusBadge } from "@/components/problems/problem-status-badge";
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

export default function ProblemsPage() {
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

  return (
    <div className="max-w-4xl mx-auto">
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
    </div>
  );
} 