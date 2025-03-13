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

// 模拟学生数据 - 增加更多数据以展示分页效果
const mockStudents = [
  { id: "1", username: "张三", email: "zhangsan@example.com" },
  { id: "2", username: "李四", email: "lisi@example.com" },
  { id: "3", username: "王五", email: "wangwu@example.com" },
  { id: "4", username: "赵六", email: "zhaoliu@example.com" },
  { id: "5", username: "钱七", email: "qianqi@example.com" },
  { id: "6", username: "孙八", email: "sunba@example.com" },
  { id: "7", username: "周九", email: "zhoujiu@example.com" },
  { id: "8", username: "吴十", email: "wushi@example.com" },
  { id: "9", username: "郑十一", email: "zhengshiyi@example.com" },
  { id: "10", username: "王十二", email: "wangshier@example.com" },
  { id: "11", username: "李十三", email: "lishisan@example.com" },
  { id: "12", username: "赵十四", email: "zhaoshisi@example.com" },
  { id: "13", username: "钱十五", email: "qianshiwu@example.com" },
  { id: "14", username: "孙十六", email: "sunshiliu@example.com" },
  { id: "15", username: "周十七", email: "zhoushiqi@example.com" },
  { id: "16", username: "吴十八", email: "wushiba@example.com" },
  { id: "17", username: "郑十九", email: "zhengshijiu@example.com" },
  { id: "18", username: "王二十", email: "wangershi@example.com" },
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

// 表单验证模式 - 添加学生
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

export default function StudentPage() {
  // 当前用户角色（模拟数据）
  const userRole: Role = "teacher";
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof editFormSchema>>({
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

  const handleEditClick = (student: typeof mockStudents[0]) => {
    setSelectedStudent(student);
    form.reset({
      username: student.username,
      password: "",
      confirmPassword: "",
    });
    setIsEditDialogOpen(true);
  };

  const onEditSubmit = (values: z.infer<typeof editFormSchema>) => {
    // 这里应该调用API更新学生信息
    console.log("更新学生信息:", { id: selectedStudent?.id, ...values });
    
    // 模拟成功响应
    toast.success("学生信息已更新");
    setIsEditDialogOpen(false);
  };

  const onAddSubmit = (values: z.infer<typeof addFormSchema>) => {
    // 这里应该调用API添加学生
    console.log("添加学生:", values);
    
    // 模拟成功响应
    toast.success("学生添加成功");
    setIsAddDialogOpen(false);
    addForm.reset();
  };

  // 检查是否有编辑权限
  const hasEditPermission = ["admin", "teacher"].includes(userRole);

  // 根据搜索条件筛选学生
  const filteredStudents = mockStudents.filter(student => 
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 计算总页数
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  
  // 获取当前页的数据
  const currentStudents = filteredStudents.slice(
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
      <h1 className="text-2xl font-bold mb-6">学生信息管理</h1>
      
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
            添加学生
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
            {currentStudents.length > 0 ? (
              currentStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.username}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  {hasEditPermission && (
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(student)}
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
                  没有找到匹配的学生
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控件 */}
      {filteredStudents.length > 0 && (
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
            <DialogTitle>修改学生信息</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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

      {/* 添加学生对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>添加学生</DialogTitle>
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