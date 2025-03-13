"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    // 获取授权码
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const savedState = typeof window !== "undefined" ? localStorage.getItem("coze_auth_state") : null;
    
    // 打印授权码
    console.log("授权码 (code):", code);
    
    if (!code) {
      toast({
        title: "授权失败",
        description: "未收到授权码",
        variant: "destructive",
      });
      router.push("/problems");
      return;
    }

    if (state !== savedState) {
      toast({
        title: "授权失败",
        description: "状态验证失败，可能存在安全风险",
        variant: "destructive",
      });
      router.push("/problems");
      return;
    }

    // 获取到授权码后，调用后端接口获取访问令牌
    exchangeCodeForToken(code, state);
  }, [searchParams]);

  const exchangeCodeForToken = async (code: string, state: string | null) => {
    try {
      console.log("开始交换授权码获取访问令牌...");
      console.log("授权码:", code);
      console.log("状态:", state);

      const response = await fetch("/api/auth/coze/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const data = await response.json();
      console.log("获取访问令牌成功");
      
      // 存储访问令牌
      if (typeof window !== "undefined") {
        localStorage.setItem("coze_access_token", data.access_token);
        localStorage.removeItem("coze_auth_state");
        
        // 恢复之前保存的工作流输入参数
        const savedInput = localStorage.getItem("coze_workflow_input");
        if (savedInput) {
          console.log("恢复保存的工作流输入:", savedInput);
          localStorage.removeItem("coze_workflow_input");
        }
      }
      
      // 授权成功提示
      toast({
        title: "授权成功",
        description: "您现在可以执行 Coze 工作流了",
      });
      
      // 重定向回问题列表页面
      router.push("/problems");
      
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      toast({
        title: "授权失败",
        description: "获取访问令牌时出错",
        variant: "destructive",
      });
      router.push("/problems");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">正在处理授权...</h1>
        <p className="text-gray-600">请稍候，正在完成 Coze 授权流程</p>
      </div>
    </div>
  );
} 