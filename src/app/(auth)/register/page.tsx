"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { authService, CodeVerification } from "@/lib/services/auth";

const formSchema = z
  .object({
    email: z.string().email({
      message: "请输入有效的邮箱地址",
    }),
    password: z.string().min(6, {
      message: "密码至少需要6个字符",
    }),
    confirmPassword: z.string(),
    code: z.string().length(6, {
      message: "请输入6位验证码",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(0);
  const [verification, setVerification] = useState<CodeVerification | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      code: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // 直接发送注册请求，让服务端验证验证码
      console.log('正在提交注册信息:', {
        email: values.email,
        password: values.password,
        role_id: 0,
        code: values.code,
      });

      const userData = await authService.register({
        email: values.email,
        password: values.password,
        role_id: 0, // 默认为学生角色
        code: values.code,
      });

      console.log('注册成功:', userData);

      toast({
        title: "注册成功",
        description: "请前往登录页面进行登录",
      });
      router.push('/login');
    } catch (error) {
      console.error('注册失败:', error);
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }

  // 发送验证码
  const handleSendCode = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        type: "manual",
        message: "请先输入邮箱地址",
      });
      return;
    }

    // 验证邮箱格式
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      form.setError("email", {
        type: "manual",
        message: "请输入有效的邮箱地址",
      });
      return;
    }

    try {
      console.log('正在发送验证码到:', email);
      const result = await authService.sendVerificationCode(email);
      console.log('验证码发送成功:', result);
      
      // 保存验证码信息
      setVerification({
        code: result.code,
        expiresAt: Date.now() + result.expires_in * 1000,
      });
      
      toast({
        title: "发送成功",
        description: "验证码已发送，请注意查收",
      });

      // 开始倒计时
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('验证码发送失败:', error);
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧图片 */}
      <div className="flex-[6] relative hidden lg:block">
        <Image
          src="/register.svg"
          alt="Register illustration"
          fill
          className="object-contain p-8"
        />
      </div>

      {/* 右侧表单 */}
      <div className="flex-[4] flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">学生注册</CardTitle>
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
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>验证码</FormLabel>
                      <div className="flex space-x-4">
                        <FormControl>
                          <Input
                            placeholder="请输入验证码"
                            maxLength={6}
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-32 shrink-0"
                          onClick={handleSendCode}
                          disabled={countdown > 0}
                        >
                          {countdown > 0 ? `${countdown}秒后重试` : "发送验证码"}
                        </Button>
                      </div>
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
                        <Input
                          type="password"
                          placeholder="请输入密码"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>确认密码</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="请再次输入密码"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  注册
                </Button>
                <div className="text-center text-sm">
                  已有账号？{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    立即登录
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