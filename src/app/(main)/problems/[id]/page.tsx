"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { loader } from '@monaco-editor/react';
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProblemData } from "@/lib/services/problems";
import { problemService } from "@/lib/services/problem";
import { useToast } from "@/components/ui/use-toast";

// 配置 Monaco 资源路径
loader.config({ paths: { vs: '/vs' } });

// 动态导入 Editor 并禁用 SSR
const Editor = dynamic(
  () => import('@monaco-editor/react'),
  { ssr: false }
);

const defaultCode = `def solution(nums: list[int], target: int) -> list[int]:
    # 在这里写下你的代码
    pass
`;

export default function ProblemDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [code, setCode] = useState(defaultCode);
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      // 获取用户角色
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const roleMap: Record<number, string> = {
          2: 'admin',
          1: 'teacher',
          0: 'student'
        };
        setUserRole(roleMap[user.role_id] || 'student');
      }

      const problemData = searchParams.get('data');
      if (problemData) {
        const decodedData = JSON.parse(decodeURIComponent(problemData));
        setProblem(decodedData);
      } else {
        toast({
          title: "错误",
          description: "未找到问题数据",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('解析问题数据失败:', error);
      toast({
        title: "错误",
        description: "解析问题数据失败",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, toast]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // 获取用户信息
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          title: "错误",
          description: "请先登录",
          variant: "destructive",
        });
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      const problemId = parseInt(id as string);

      // 确保用户ID和角色ID正确
      const userId = user.user_id || user.id;
      const roleId = user.role_id;

      // 提交答案
      const response = await problemService.submitAnswer({
        user_id: userId,
        role_id: roleId,
        problem_id: problemId,
        student_answer: code,
        problem_desc: problem?.detail,
      });

      console.log('提交响应:', response);

      if (response.code === 200 && response.data) {
        // 显示结果
        const resultMessage = response.data.is_correct ? "答案正确！" : "答案错误，请重试";
        const bgColor = response.data.is_correct ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400";
        
        toast({
          title: "提交成功",
          description: resultMessage,
          className: `${bgColor} text-black`,
        });

        // 如果答案正确，可以选择跳转到下一题或留在当前页面
        if (response.data.is_correct) {
          // TODO: 可以添加跳转到下一题的逻辑
        }
      } else {
        toast({
          title: "提交失败",
          description: response.message || "请稍后重试",
          variant: "default",
          className: "bg-red-100 border-red-400 text-black",
        });
      }
    } catch (error: any) {
      console.error('提交失败:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = "提交失败，请稍后重试";
      let bgColor = "bg-red-100 border-red-400";
      
      if (error.code === 0) {
        errorMessage = "网络连接失败，请检查网络设置后重试";
        bgColor = "bg-yellow-100 border-yellow-400";
      } else if (error.code === 401) {
        errorMessage = "登录已过期，请重新登录";
        router.push('/login');
      } else if (error.code === 429) {
        errorMessage = "提交次数过多，请稍后再试";
      } else if (error.code === 500) {
        errorMessage = "服务器错误，请稍后再试";
      }
      
      toast({
        title: "提交失败",
        description: errorMessage,
        variant: "default",
        className: `${bgColor} text-black`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">问题不存在</h1>
          <Link
            href="/problems"
            className="text-blue-600 hover:underline"
          >
            返回问题列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/problems"
          className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          返回问题列表
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
          <Card className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-lg font-semibold mb-4">问题描述</h2>
              <div className="whitespace-pre-wrap">{problem.detail}</div>

              {(problem.example_input || problem.example_output) && (
                <div className="mt-6 space-y-4">
                  {problem.example_input && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">示例输入：</h3>
                      <pre className="bg-muted p-4 rounded-lg">
                        {problem.example_input}
                      </pre>
                    </div>
                  )}
                  {problem.example_output && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">示例输出：</h3>
                      <pre className="bg-muted p-4 rounded-lg">
                        {problem.example_output}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">代码编辑器</h2>
            {userRole === 'student' && (
              <Button 
                onClick={handleSubmit} 
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "提交中..." : "提交代码"}
              </Button>
            )}
          </div>
          <Card className="overflow-hidden border">
            <Editor
              height="500px"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                lineNumbersMinChars: 3,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
} 