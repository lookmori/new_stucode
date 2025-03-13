"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CozeAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // 获取授权码
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (code) {
      // 获取到授权码后，调用后端接口获取访问令牌
      exchangeCodeForToken(code, state);
    }
  }, [searchParams]);

  const exchangeCodeForToken = async (code: string, state: string | null) => {
    try {
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
      
      // 存储访问令牌
      localStorage.setItem("coze_access_token", data.access_token);
      
      // 重定向到之前的页面或首页
      router.push(state || "/");
      
    } catch (error) {
      console.error("Error exchanging code for token:", error);
      // 处理错误情况
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