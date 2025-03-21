"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { Navbar } from "@/components/layout/navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        // 获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          router.push('/login');
          return;
        }

        const user = JSON.parse(userStr);
        const roleId = user.role_id;

        // 如果是根路径，重定向到problems
        if (pathname === '/') {
          router.push('/problems');
          return;
        }

        // 学生角色（role_id === 0）只能访问problems相关页面
        if (roleId === 0) {
          const allowedPaths = ['/problems', '/problems/'];
          // 允许访问具体题目页面 /problems/[id]
          const isProblemsPath = pathname.startsWith('/problems/');
          const isProfilePath = pathname === '/profile';
          
          if (!allowedPaths.includes(pathname) && !isProblemsPath && !isProfilePath) {
            console.log('未授权访问，重定向到problems页面');
            router.push('/problems');
            return;
          }
        }

        // 教师角色（role_id === 1）只能访问problems和student相关页面
        if (roleId === 1) {
          const allowedPaths = ['/problems', '/problems/', '/student'];
          const isProblemsPath = pathname.startsWith('/problems/');
          const isProfilePath = pathname === '/profile';
          
          if (!allowedPaths.includes(pathname) && !isProblemsPath && !isProfilePath) {
            console.log('未授权访问，重定向到problems页面');
            router.push('/problems');
            return;
          }
        }

        // 管理员（role_id === 2）可以访问所有页面
        if (roleId === 2) {
          // No additional restrictions for admin
        }

        setIsLoading(false);
      } catch (error) {
        console.error('权限检查失败:', error);
        // 清除可能损坏的用户数据
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-6">
        <Toaster richColors />
        {children}
      </main>
    </div>
  );
} 