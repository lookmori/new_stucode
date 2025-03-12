"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Problem } from "@/types/problem";

// 模拟数据，实际项目中应该从API获取
const mockProblem: Problem = {
  id: "problem-1",
  title: "两数之和",
  status: "PENDING",
  description: `给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。`,
  sampleInput: `nums = [2,7,11,15], target = 9`,
  sampleOutput: `[0,1]
因为 nums[0] + nums[1] == 9 ，返回 [0, 1] 。`,
};

const defaultCode = `def solution(nums: list[int], target: int) -> list[int]:
    # 在这里写下你的代码
    pass
`;

export default function ProblemDetailPage() {
  const { id } = useParams();
  const [code, setCode] = useState(defaultCode);

  const handleSubmit = async () => {
    // TODO: 实现提交逻辑
    console.log("提交代码:", code);
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
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
          <h1 className="text-2xl font-bold mb-4">{mockProblem.title}</h1>
          <Card className="p-6">
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-lg font-semibold mb-4">问题描述</h2>
              <div className="whitespace-pre-wrap">{mockProblem.description}</div>

              {(mockProblem.sampleInput || mockProblem.sampleOutput) && (
                <div className="mt-6 space-y-4">
                  {mockProblem.sampleInput && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">示例输入：</h3>
                      <pre className="bg-muted p-4 rounded-lg">
                        {mockProblem.sampleInput}
                      </pre>
                    </div>
                  )}
                  {mockProblem.sampleOutput && (
                    <div>
                      <h3 className="text-md font-semibold mb-2">示例输出：</h3>
                      <pre className="bg-muted p-4 rounded-lg">
                        {mockProblem.sampleOutput}
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
            <Button onClick={handleSubmit} size="sm">
              提交答案
            </Button>
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