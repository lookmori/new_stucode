"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService, LoginResponseData } from "@/lib/services/auth";
import { useToast } from "@/components/ui/use-toast";
import { RequestError } from "@/lib/request";

const formSchema = z.object({
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
  role: z.string(),
  rememberMe: z.boolean().default(false),
  submitting: z.boolean().default(false),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "0",
      rememberMe: false,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 禁用提交按钮，防止重复提交
      form.setValue('submitting', true);

      console.log('正在登录:', {
        email: values.email,
        password: values.password,
        role_id: parseInt(values.role),
      });

      const response = await authService.login({
        email: values.email,
        password: values.password,
        role_id: parseInt(values.role),
      });

      console.log('登录响应:', response);

      // 检查响应状态码
      if (response.code !== 200 || !response.data) {
        // 显示具体的错误信息
        toast({
          title: "登录失败",
          description: response.message || "登录失败，请检查账号密码是否正确",
          variant: "default",
          duration: 5000,
          className: "bg-red-100 border-red-400 text-black",
        });
        return;
      }

      const userData = response.data;

      try {
        // 保存 token 到 cookie 和 localStorage
        document.cookie = `token=${userData.token}; path=/`;
        localStorage.setItem('token', userData.token);
        
        // 保存用户信息
        localStorage.setItem('user', JSON.stringify({
          username: userData.username,
          email: userData.email,
          role_id: userData.role_id
        }));

        // 如果需要记住密码，可以将凭证保存到 localStorage
        if (values.rememberMe) {
          localStorage.setItem('email', values.email);
        }

        toast({
          title: "登录成功",
          description: "正在跳转到问题列表...",
        });

        // 使用 replace 而不是 push，这样用户不能通过后退按钮返回到登录页
        router.replace('/problems');
        router.refresh();
      } catch (storageError) {
        console.error('保存用户信息失败:', storageError);
        toast({
          title: "警告",
          description: "登录成功，但保存用户信息失败，部分功能可能受限",
          variant: "default",
          duration: 5000,
          className: "bg-orange-100 border-orange-400 text-black",
        });
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = "登录失败，请稍后重试";
      let errorTitle = "登录失败";
      let bgColor = "bg-red-100 border-red-400";
      
      if (error instanceof RequestError) {
        if (error.code === 401) {
          errorMessage = "账号或密码错误";
        } else if (error.code === 403) {
          errorMessage = "该角色无权限登录";
        } else if (error.code === 0) {
          errorTitle = "网络错误";
          errorMessage = error.message || "网络连接失败，请检查网络设置后重试";
          bgColor = "bg-yellow-100 border-yellow-400";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "default",
        duration: 5000,
        className: `${bgColor} text-black`,
      });
    } finally {
      // 恢复提交按钮
      form.setValue('submitting', false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧图片 */}
      <div className="flex-[6] relative hidden lg:block">
        <Image
          src="/login.svg"
          alt="Login illustration"
          fill
          className="object-contain p-8"
        />
      </div>

      {/* 右侧表单 */}
      <div className="flex-[4] flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">登录</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入邮箱" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>密码</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="请输入密码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">学生</SelectItem>
                          <SelectItem value="1">教师</SelectItem>
                          <SelectItem value="2">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">记住密码</FormLabel>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={form.getValues('submitting')}>
                  登录
                </Button>
                <div className="text-center text-sm">
                  还没有账号？{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    立即注册
                  </Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 