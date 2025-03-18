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
import { authService, LoginResponseData, ResetPasswordData } from "@/lib/services/auth";
import { useToast } from "@/components/ui/use-toast";
import { RequestError } from "@/lib/request";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

// 找回密码表单验证
const resetPasswordSchema = z.object({
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  code: z.string().length(6, {
    message: "验证码必须是6位数字",
  }),
  newPassword: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
  confirmPassword: z.string().min(6),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // 找回密码表单状态
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "0",
      rememberMe: false,
      submitting: false,
    },
  });

  // 重置密码表单
  const resetForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
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
          user_id: userData.user_id,
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

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      // 设置表单值
      resetForm.setValue('email', resetEmail);
      
      // 验证邮箱
      const valid = await resetForm.trigger('email');
      if (!valid) return;

      setIsSendingCode(true);

      const response = await authService.sendVerificationCode(resetEmail);
      
      if (response.code === 200) {
        toast({
          title: "发送成功",
          description: "验证码已发送到您的邮箱，请查收",
          variant: "default",
          className: "bg-green-100 border-green-400 text-black",
        });
        
        // 设置倒计时
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
      console.error('发送验证码失败:', error);
      toast({
        title: "发送失败",
        description: error instanceof Error ? error.message : "验证码发送失败，请稍后重试",
        variant: "default",
        className: "bg-red-100 border-red-400 text-black",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    try {
      // 设置表单值
      resetForm.setValue('email', resetEmail);
      resetForm.setValue('code', resetCode);
      resetForm.setValue('newPassword', resetPassword);
      resetForm.setValue('confirmPassword', resetConfirmPassword);
      
      // 验证表单
      const valid = await resetForm.trigger();
      if (!valid) return;
      
      // 调用重置密码API
      const response = await authService.resetPassword({
        email: resetEmail,
        code: resetCode,
        newPassword: resetPassword,
      });
      
      if (response.code === 200) {
        toast({
          title: "密码重置成功",
          description: "请使用新密码登录",
          variant: "default",
          className: "bg-green-100 border-green-400 text-black",
        });
        
        // 关闭对话框，重置表单
        setIsDialogOpen(false);
        resetForm.reset();
        setResetEmail("");
        setResetCode("");
        setResetPassword("");
        setResetConfirmPassword("");
        
        // 自动填充邮箱
        form.setValue('email', resetEmail);
      } else {
        toast({
          title: "重置失败",
          description: response.message || "密码重置失败，请稍后重试",
          variant: "default",
          className: "bg-red-100 border-red-400 text-black",
        });
      }
    } catch (error: any) {
      console.error('重置密码失败:', error);
      toast({
        title: "重置失败",
        description: error instanceof Error ? error.message : "密码重置失败，请稍后重试",
        variant: "default",
        className: "bg-red-100 border-red-400 text-black",
      });
    }
  };

  // 对话框关闭时重置状态
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm.reset();
      setResetEmail("");
      setResetCode("");
      setResetPassword("");
      setResetConfirmPassword("");
      setCountdown(0);
    }
  };

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
                <div className="flex justify-between items-center">
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
                  <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="text-sm p-0">
                        忘记密码？
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>找回密码</DialogTitle>
                        <DialogDescription>
                          请填写以下信息重置您的密码
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <FormLabel>邮箱</FormLabel>
                          <div className="flex space-x-2">
                            <Input 
                              placeholder="请输入邮箱" 
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                            />
                            <Button 
                              type="button" 
                              onClick={sendVerificationCode}
                              disabled={isSendingCode || countdown > 0}
                            >
                              {isSendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒后重发` : '发送验证码'}
                            </Button>
                          </div>
                          {resetForm.formState.errors.email && (
                            <p className="text-sm text-red-500">{resetForm.formState.errors.email.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <FormLabel>验证码</FormLabel>
                          <Input 
                            placeholder="请输入6位验证码" 
                            value={resetCode}
                            onChange={(e) => setResetCode(e.target.value)}
                            maxLength={6}
                          />
                          {resetForm.formState.errors.code && (
                            <p className="text-sm text-red-500">{resetForm.formState.errors.code.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <FormLabel>新密码</FormLabel>
                          <Input 
                            type="password" 
                            placeholder="请输入新密码" 
                            value={resetPassword}
                            onChange={(e) => setResetPassword(e.target.value)}
                          />
                          {resetForm.formState.errors.newPassword && (
                            <p className="text-sm text-red-500">{resetForm.formState.errors.newPassword.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <FormLabel>确认密码</FormLabel>
                          <Input 
                            type="password" 
                            placeholder="请再次输入新密码" 
                            value={resetConfirmPassword}
                            onChange={(e) => setResetConfirmPassword(e.target.value)}
                          />
                          {resetForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-500">{resetForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleResetPassword}>
                          重置密码
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
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