"use client";

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
import { useToast } from "@/components/ui/use-toast";
import { authService } from "@/lib/services/auth";

const navItems = [
  {
    href: "/problems",
    label: "问题列表",
  },
  {
    href: "/student",
    label: "学生页面",
  },
  {
    href: "/teacher",
    label: "教师页面",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    try {
      // 调用退出登录方法
      authService.logout();
      
      toast({
        title: "退出成功",
        description: "正在跳转到登录页面...",
      });

      // 强制刷新并跳转到登录页
      router.refresh();
      router.replace('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      toast({
        title: "退出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <Link href="/" className="font-bold text-xl">
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
                pathname === item.href
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* 右侧个人中心 */}
        <div className="ml-auto flex items-center space-x-4">
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