"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Trash2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { userService, UserInfo } from "@/lib/services/user";

// 模拟教师数据
const mockTeachers = [
  { id: "1", username: "张老师", email: "zhang@example.com" },
  { id: "2", username: "李老师", email: "li@example.com" },
  { id: "3", username: "王老师", email: "wang@example.com" },
  { id: "4", username: "赵老师", email: "zhao@example.com" },
  { id: "5", username: "钱老师", email: "qian@example.com" },
];

// 表单验证模式 - 修改信息
const editFormSchema = z.object({
  username: z.string().min(2, {
    message: "用户名至少需要2个字符",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

// 表单验证模式 - 添加教师
const addFormSchema = z.object({
  username: z.string().min(2, {
    message: "用户名至少需要2个字符",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符",
  }),
});

// 用户角色类型
type Role = "admin" | "teacher" | "student";

export default function TeacherPage() {
  // 修改状态定义
  const [teachers, setTeachers] = useState<{id: string; username: string; email: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<{id: string; username: string; email: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<{id: string; username: string; email: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 使用shadcn的toast
  const { toast } = useToast();

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const addForm = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // 获取用户角色和教师列表
  useEffect(() => {
    const fetchUserRoleAndTeachers = async () => {
      try {
        // 从 localStorage 获取用户信息
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          throw new Error('未登录');
        }
        
        console.log("原始用户信息字符串:", userStr);
        const user = JSON.parse(userStr);
        console.log("解析后的用户对象:", user);
        
        // 设置用户ID和角色ID - 尝试不同的属性名
        let currentUserId;
        if (user.user_id !== undefined) {
          currentUserId = user.user_id;
        } else if (user.id !== undefined) {
          currentUserId = user.id;
        } else if (user.userId !== undefined) {
          currentUserId = user.userId;
        } else {
          // 如果找不到任何ID属性，尝试记录完整的对象
          console.error("无法获取用户ID，用户对象:", JSON.stringify(user));
          throw new Error('无法获取用户ID');
        }
        
        const currentRoleId = user.role_id || user.roleId;
        console.log("提取的用户信息:", { currentUserId, currentRoleId });
        
        setUserId(currentUserId);
        setRoleId(currentRoleId);
        
        // 设置用户角色
        const roleMap: Record<number, Role> = {
          2: 'admin',
          1: 'teacher',
          0: 'student'
        };
        setUserRole(roleMap[currentRoleId] || 'student');
        
        // 调用API获取教师列表
        const result = await userService.getUserInfo({
          user_id: currentUserId,
          role_id: currentRoleId,
          find_id: 1 // 查询教师列表
        });
        
        console.log("获取教师列表响应:", result);
        
        if (result.code === 200 && result.data) {
          // 转换数据格式
          const teacherList = result.data.map(teacher => ({
            id: teacher.userId.toString(),
            username: teacher.username,
            email: teacher.email
          }));
          
          setTeachers(teacherList);
        } else {
          throw new Error(result.message || '获取教师列表失败');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        toast({
          variant: "destructive",
          title: "错误",
          description: error instanceof Error ? error.message : "获取数据失败",
          className: "text-black"
        });
        
        // 如果API调用失败，使用模拟数据（仅用于开发）
        if (process.env.NODE_ENV !== 'production') {
          setTeachers(mockTeachers);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoleAndTeachers();
  }, []);

  const handleEditClick = (teacher: {id: string; username: string; email: string}) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      username: teacher.username,
      password: "",
      confirmPassword: "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!selectedTeacher) return;
    
    try {
      // 获取当前用户信息
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未登录",
          className: "text-black"
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const operatorId = user.user_id || user.id;
      const roleId = user.role_id;
      
      // 检查是否为管理员
      if (roleId !== 2) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "权限不足，只有管理员可以修改教师信息",
          className: "text-black"
        });
        return;
      }
      
      // 检查是否至少提供了一项要修改的信息
      if (!values.username && !values.password) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "请至少提供一项要修改的信息（用户名或密码）",
          className: "text-black"
        });
        return;
      }
      
      // 准备请求参数
      const params: any = {
        operator_id: operatorId,
        role_id: roleId,
        user_id: parseInt(selectedTeacher.id)
      };
      
      // 只添加有值的字段
      if (values.username) {
        params.username = values.username;
      }
      
      if (values.password) {
        params.password = values.password;
      }
      
      // 调用API修改用户信息
      const result = await userService.updateUser(params);
      
      console.log("修改教师信息响应:", result);
      
      if (result.code === 200) {
        toast({
          variant: "default",
          title: "成功",
          description: result.message || "教师信息已更新"
        });
        
        // 更新本地数据
        if (values.username) {
          // 更新teachers状态
          setTeachers(prev => 
            prev.map(t => 
              t.id === selectedTeacher.id 
                ? { ...t, username: values.username } 
                : t
            )
          );
        }
        
        setIsEditDialogOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "错误",
          description: result.message ?? "修改教师信息失败",
          className: "text-black"
        });
      }
    } catch (error) {
      console.error('修改教师信息失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "修改失败",
        className: "text-black"
      });
    }
  };

  const onAddSubmit = async (values: z.infer<typeof addFormSchema>) => {
    try {
      // 获取当前用户角色ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未登录",
          className: "text-black"
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查是否为管理员
      if (roleId !== 2) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "权限不足，只有管理员可以添加教师",
          className: "text-black"
        });
        return;
      }
      
      // 调用API添加教师
      const result = await userService.addTeacher({
        username: values.username,
        email: values.email,
        password: values.password,
        role_id: roleId
      });
      
      console.log("添加教师响应:", result);
      console.log("服务器返回的消息:", result.message);
      
      if (result.code === 200 && result.data) {
        const successMsg = result.message || "教师添加成功";
        console.log("显示的成功消息:", successMsg);
        toast({
          variant: "default",
          title: "成功",
          description: successMsg
        });
        
        // 添加到teachers状态
        setTeachers(prev => {
          const newTeachers = [...prev, {
            id: result.data?.user_id?.toString() || "0",
            username: result.data?.username || "",
            email: result.data?.email || ""
          }];
          console.log("添加教师后的教师列表:", newTeachers);
          return newTeachers;
        });
        
        setIsAddDialogOpen(false);
        addForm.reset();
      } else {
        // 统一处理所有错误情况，直接使用服务器返回消息
        console.log("添加教师失败:", result.code, result.message);
        
        // 确保message不为空，并添加明显的标识
        const errorMsg = result.message ? `添加失败：${result.message}` : "添加教师失败，请稍后重试";
        console.log("将显示错误:", errorMsg);
        
        // 先显示错误消息
        toast({
          variant: "destructive",
          title: "错误",
          description: errorMsg,
          className: "text-black"
        });
        
        // 使用setTimeout延迟关闭对话框
        setTimeout(() => {
          setIsAddDialogOpen(false);
        }, 500);
        
        return; // 提前返回，不要立即关闭对话框
      }
    } catch (error) {
      console.error('添加教师失败:', error);
      
      // 显示错误提示
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "添加失败，请稍后重试",
        className: "text-black"
      });
      
      // 延迟关闭对话框
      setTimeout(() => {
        setIsAddDialogOpen(false);
      }, 500);
    }
  };

  // 检查是否有编辑权限（只有管理员可以编辑）
  const hasEditPermission = userRole === "admin";

  // 根据搜索条件筛选教师
  const filteredTeachers = teachers.filter(teacher => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const username = teacher.username?.toLowerCase() || "";
    const email = teacher.email?.toLowerCase() || "";
    
    return username.includes(query) || email.includes(query);
  });

  // 计算总页数
  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  
  // 获取当前页的数据
  const currentTeachers = filteredTeachers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // 重置到第一页
  };

  // 生成分页链接
  const generatePaginationLinks = () => {
    const links = [];
    
    // 添加前5页或总页数（取较小值）
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setCurrentPage(i)}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // 如果总页数大于5，添加省略号
    if (totalPages > 5) {
      links.push(
        <PaginationItem key="ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    return links;
  };

  // 处理删除点击
  const handleDeleteClick = (teacher: {id: string; username: string; email: string}) => {
    setTeacherToDelete(teacher);
    setIsDeleteConfirmOpen(true);
  };

  // 执行删除操作
  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // 获取当前用户角色ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未登录",
          className: "text-black"
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查是否为管理员
      if (roleId !== 2) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "权限不足，只有管理员可以删除用户",
          className: "text-black"
        });
        return;
      }
      
      // 调用API删除用户
      const result = await userService.deleteUser({
        user_id: parseInt(teacherToDelete.id),
        role_id: roleId
      });
      
      console.log("删除用户响应:", result);
      
      if (result.code === 200) {
        toast({
          variant: "default",
          title: "成功",
          description: result.message || "教师删除成功"
        });
        
        // 更新teachers状态，移除已删除的教师
        setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
        
        setIsDeleteConfirmOpen(false);
      } else {
        toast({
          variant: "destructive",
          title: "错误",
          description: result.message ?? "删除教师失败",
          className: "text-black"
        });
      }
    } catch (error) {
      console.error('删除教师失败:', error);
      toast({
        variant: "destructive",
        title: "错误",
        description: error instanceof Error ? error.message : "删除失败",
        className: "text-black"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 添加加载状态显示
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">教师信息管理</h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full md:w-80 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">教师信息管理</h1>
      
      {/* 搜索框和添加按钮 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="搜索用户名..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        {hasEditPermission && (
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full md:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            添加教师
          </Button>
        )}
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-gray-100 dark:bg-gray-800">
            <TableRow>
              <TableHead className="font-bold text-black dark:text-white">用户名</TableHead>
              <TableHead className="font-bold text-black dark:text-white">邮箱</TableHead>
              {hasEditPermission && <TableHead className="text-right font-bold text-black dark:text-white">操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentTeachers.length > 0 ? (
              currentTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-medium">{teacher.username}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  {hasEditPermission && (
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(teacher)}
                      >
                        修改信息
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteClick(teacher)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={hasEditPermission ? 3 : 2} className="text-center py-6 text-muted-foreground">
                  没有找到匹配的教师
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {filteredTeachers.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {generatePaginationLinks()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 修改信息对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>修改教师信息</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>新密码</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认密码</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">保存更改</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 添加教师对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加教师</DialogTitle>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">添加</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>您确定要删除教师 <span className="font-bold">{teacherToDelete?.username}</span> 吗？</p>
            <p className="text-sm text-muted-foreground mt-2">此操作将删除该用户的所有相关数据，且无法恢复。</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 