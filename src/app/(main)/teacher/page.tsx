"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Search, Plus } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  // 当前用户角色（模拟数据）
  const userRole: Role = "admin";
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<typeof mockTeachers[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;

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

  const handleEditClick = (teacher: typeof mockTeachers[0]) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      username: teacher.username,
      password: "",
      confirmPassword: "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (values: z.infer<typeof editFormSchema>) => {
    // 这里应该调用API更新教师信息
    console.log("更新教师信息:", { id: selectedTeacher?.id, ...values });
    
    // 模拟成功响应
    toast.success("教师信息已更新");
    setIsEditDialogOpen(false);
  };

  const onAddSubmit = (values: z.infer<typeof addFormSchema>) => {
    // 这里应该调用API添加教师
    console.log("添加教师:", values);
    
    // 模拟成功响应
    toast.success("教师添加成功");
    setIsAddDialogOpen(false);
    addForm.reset();
  };

  // 检查是否有编辑权限（只有管理员可以编辑）
  const hasEditPermission = userRole === "admin";

  // 根据搜索条件筛选教师
  const filteredTeachers = mockTeachers.filter(teacher => 
    teacher.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(teacher)}
                      >
                        修改信息
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
    </div>
  );
} 