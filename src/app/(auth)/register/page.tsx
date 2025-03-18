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

      const response = await authService.register({
        email: values.email,
        password: values.password,
        role_id: 0, // 默认为学生角色
        code: values.code,
      });

      console.log('注册响应:', response);

      // 检查响应状态码
      if (response.code === 200) {
        toast({
          title: "注册成功",
          description: "请前往登录页面进行登录",
          className: "bg-green-100 border-green-400 text-black",
        });
        router.push('/login');
      } else {
        // 处理其他错误情况
        let errorMessage = response.message || "请稍后重试";
        let errorTitle = "注册失败";
        let bgColor = "bg-red-100 border-red-400";
        let shouldRedirect = false;
        
        // 检查是否是邮箱已存在的错误
        if (response.code === 400) {
          if (errorMessage.includes("邮箱已注册")) {
            errorTitle = "邮箱已存在";
            errorMessage = "该邮箱已注册，请直接登录或使用其他邮箱";
            bgColor = "bg-blue-100 border-blue-400";
            shouldRedirect = true;
          } else if (errorMessage.includes("验证码无效") || errorMessage.includes("验证码已过期")) {
            errorMessage = "验证码无效或已过期，请重新获取";
          } else if (errorMessage.includes("邮箱格式")) {
            errorMessage = "邮箱格式不正确，请检查后重试";
          } else if (errorMessage.includes("密码长度")) {
            errorMessage = "密码长度不能小于6位";
          } else if (errorMessage.includes("角色ID")) {
            errorMessage = "角色ID不正确";
          }
        } else if (response.code === 429) {
          errorMessage = "请求次数过多，请稍后再试";
        } else if (response.code === 500) {
          errorMessage = "服务器错误，请稍后再试";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "default",
          className: `${bgColor} text-black`,
        });
        
        // 如果是邮箱已存在的错误，等待3秒后跳转到登录页
        if (shouldRedirect) {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = "注册失败，请稍后重试";
      let errorTitle = "注册失败";
      let bgColor = "bg-red-100 border-red-400";
      let shouldRedirect = false;
      
      if (error.message && error.message.includes("邮箱已注册")) {
        errorTitle = "邮箱已存在";
        errorMessage = "该邮箱已注册，请直接登录或使用其他邮箱";
        bgColor = "bg-blue-100 border-blue-400";
        shouldRedirect = true;
      } else if (error.message && error.message.includes("验证码无效") || error.message && error.message.includes("验证码已过期")) {
        errorMessage = "验证码无效或已过期，请重新获取";
      } else if (error.message && error.message.includes("邮箱格式")) {
        errorMessage = "邮箱格式不正确，请检查后重试";
      } else if (error.message && error.message.includes("密码长度")) {
        errorMessage = "密码长度不能小于6位";
      } else if (error.message && error.message.includes("角色ID")) {
        errorMessage = "角色ID不正确";
      } else if (error.code === 400) {
        // 处理其他400错误
        if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = "请求参数错误，请检查输入信息";
        }
      } else if (error.code === 0) {
        errorTitle = "网络错误";
        errorMessage = error.message || "网络连接失败，请检查网络设置后重试";
        bgColor = "bg-yellow-100 border-yellow-400";
      } else if (error.code === 429) {
        errorMessage = "请求次数过多，请稍后再试";
      } else if (error.code === 500) {
        errorMessage = "服务器错误，请稍后再试";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "default",
        duration: 5000,
        className: `${bgColor} text-black`,
      });
      
      // 如果是邮箱已存在的错误，等待3秒后跳转到登录页
      if (shouldRedirect) {
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
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
      const response = await authService.sendVerificationCode(email);
      console.log('验证码发送成功:', response);
      
      if (response.code === 200 && response.data) {
        // 保存验证码信息
        setVerification({
          code: response.data.code,
          expiresAt: Date.now() + response.data.expires_in * 1000,
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
      } else {
        toast({
          title: "发送失败",
          description: response.message || "验证码发送失败，请稍后重试",
          variant: "default",
          className: "bg-red-100 border-red-400 text-black",
        });
      }
    } catch (error: any) {
      console.error('验证码发送失败:', error);
      
      // 根据错误类型显示不同的错误信息
      let errorMessage = "验证码发送失败，请稍后重试";
      let errorTitle = "发送失败";
      let bgColor = "bg-red-100 border-red-400";
      
      if (error.message && error.message.includes("邮箱已注册")) {
        errorMessage = "该邮箱已注册，请直接登录或使用其他邮箱";
      } else if (error.message && error.message.includes("邮箱格式")) {
        errorMessage = "邮箱格式不正确，请检查后重试";
      } else if (error.message && error.message.includes("发送频率")) {
        errorMessage = "发送频率过高，请稍后再试";
      } else if (error.message && error.message.includes("邮箱不存在")) {
        errorMessage = "该邮箱未注册，请先注册";
      } else if (error.code === 0) {
        errorTitle = "网络错误";
        errorMessage = error.message || "网络连接失败，请检查网络设置后重试";
        bgColor = "bg-yellow-100 border-yellow-400";
      } else if (error.code === 429) {
        errorMessage = "发送次数过多，请稍后再试";
      } else if (error.code === 500) {
        errorMessage = "服务器错误，请稍后再试";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "default",
        duration: 5000,
        className: `${bgColor} text-black`,
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