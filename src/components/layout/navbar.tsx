"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/lib/services/auth";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // 获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role_id);
        setUserName(user.username || '用户');
      } catch (error) {
        console.error('解析用户信息失败:', error);
        handleLogout();
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // 调用退出登录方法
      await authService.logout();
      
      // 清除本地存储
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      toast.success("退出成功，正在跳转到登录页面...", {
        duration: 2000,
        style: { color: 'black' }
      });

      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 500);
    } catch (error) {
      console.error('退出登录失败:', error);
      toast.error("退出失败，请稍后重试", {
        duration: 3000,
        style: { color: 'black' }
      });
    }
  };

  // 根据角色定义可见的导航项
  const getNavItems = () => {
    const items = [];

    // 所有角色都可以看到问题列表
    items.push({
      href: "/problems",
      label: "问题列表",
      active: pathname.startsWith("/problems")
    });

    // 教师和管理员可以看到学生管理
    if (userRole === 1 || userRole === 2) {
      items.push({
        href: "/student",
        label: "学生管理",
        active: pathname === "/student"
      });
    }

    // 只有管理员可以看到教师管理
    if (userRole === 2) {
      items.push({
        href: "/teacher",
        label: "教师管理",
        active: pathname === "/teacher"
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/problems" className="font-bold text-xl">
          在线做题
        </Link>
        
        {/* 导航链接 */}
        <div className="ml-8 flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors hover:text-primary",
                item.active ? "text-primary font-medium" : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* 右侧个人中心 */}
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            {userName}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">个人中心</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
} 