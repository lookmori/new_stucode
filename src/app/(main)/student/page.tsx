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
import { Toaster, toast } from "sonner";
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
import { userService, UserData, UserInfo } from "@/lib/services/user";

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
  // 修改状态定义
  const [students, setStudents] = useState<{id: string; username: string; email: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 10;
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<typeof mockStudents[0] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 获取用户角色和学生列表
  useEffect(() => {
    const fetchUserRoleAndStudents = async () => {
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
        
        // 调用API获取学生列表
        const result = await userService.getUserInfo({
          user_id: currentUserId,
          role_id: currentRoleId,
          find_id: 0 // 查询学生列表
        });
        
        console.log("获取学生列表响应:", result);
        
        if (result.code === 200 && result.data) {
          // 转换数据格式
          const studentList = result.data.map(student => ({
            id: student.userId.toString(),
            username: student.username,
            email: student.email
          }));
          
          setStudents(studentList);
        } else {
          throw new Error(result.message || '获取学生列表失败');
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        toast.error(error instanceof Error ? error.message : "获取数据失败", {
          duration: 3000, // 3秒后自动消失
        });
        
        // 如果API调用失败，使用模拟数据（仅用于开发）
        if (process.env.NODE_ENV !== 'production') {
          setStudents(mockStudents);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoleAndStudents();
  }, []);

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

  const onEditSubmit = async (values: z.infer<typeof editFormSchema>) => {
    if (!selectedStudent) return;
    
    try {
      // 获取当前用户信息
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("未登录", {
          duration: 3000,
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const operatorId = user.user_id || user.id;
      const roleId = user.role_id;
      
      // 检查是否为教师或管理员
      if (roleId !== 1 && roleId !== 2) {
        toast.error("权限不足，只有教师或管理员可以修改学生信息", {
          duration: 3000,
        });
        return;
      }
      
      // 检查是否至少提供了一项要修改的信息
      if (!values.username && !values.password) {
        toast.error("请至少提供一项要修改的信息（用户名或密码）", {
          duration: 3000,
        });
        return;
      }
      
      // 调用API修改学生信息
      const result = await userService.updateUser({
        user_id: parseInt(selectedStudent.id),
        username: values.username || undefined,
        password: values.password || undefined,
        role_id: roleId
      });
      
      console.log("修改学生信息响应:", result);
      
      // 无论成功与否都显示服务器返回的消息
      if (result.code === 200) {
        toast.success(result.message || "修改成功", {
          duration: 3000,
        });
        
        // 更新本地数据
        setStudents(prev => prev.map(student => 
          student.id === selectedStudent.id
            ? { ...student, username: values.username || student.username }
            : student
        ));
        
        setIsEditDialogOpen(false);
        form.reset();
      } else {
        toast.error(result.message || "修改失败", {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('修改学生信息失败:', error);
      if (error instanceof Error) {
        toast.error(error.message, {
          duration: 3000,
        });
      } else {
        toast.error("修改失败，请稍后重试", {
          duration: 3000,
        });
      }
    }
  };

  const onAddSubmit = async (values: z.infer<typeof addFormSchema>) => {
    try {
      // 获取当前用户角色ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("未登录", {
          style: { color: 'black' }
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查是否为教师或管理员
      if (roleId !== 1 && roleId !== 2) {
        toast.error("权限不足，只有教师或管理员可以添加学生", {
          style: { color: 'black' }
        });
        return;
      }
      
      // 调用API添加学生
      const result = await userService.addStudent({
        username: values.username,
        email: values.email,
        password: values.password,
        role_id: roleId
      });
      
      console.log("添加学生响应:", result);
      
      if (result.code === 200) {
        toast.success(result.message || "学生添加成功", {
          style: { color: 'black' }
        });
        
        if (result.data) {
          const userData = result.data;
          // 添加到本地数据
          setStudents(prev => [...prev, {
            id: String(userData.user_id),
            username: userData.username,
            email: userData.email
          }]);
        }
        
        setIsAddDialogOpen(false);
        addForm.reset();
      } else {
      setIsAddDialogOpen(false);
        addForm.reset();
        console.log("添加学生失败:", result);
        toast.error(result.message || "添加学生失败", {
          style: { color: 'black' }
        });
      }
    } catch (error) {
    setIsAddDialogOpen(false);
        addForm.reset();
      console.error('添加学生失败:', error);
      toast.error("添加学生失败，请稍后重试", {
        style: { color: 'black' }
      });
    }
  };

  // 处理删除点击
  const handleDeleteClick = (student: typeof mockStudents[0]) => {
    setStudentToDelete(student);
    setIsDeleteConfirmOpen(true);
  };

  // 执行删除操作
  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    try {
      setIsDeleting(true);
      
      // 获取当前用户角色ID
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("未登录", {
          duration: 3000,
        });
        return;
      }
      
      const user = JSON.parse(userStr);
      const roleId = user.role_id;
      
      // 检查是否为管理员
      if (roleId !== 2) {
        toast.error("权限不足，只有管理员可以删除用户", {
          duration: 3000,
        });
        return;
      }
      
      // 调用API删除用户
      const result = await userService.deleteUser({
        user_id: parseInt(studentToDelete.id),
        role_id: roleId
      });
      
      console.log("删除用户响应:", result);
      
      // 无论成功与否都显示服务器返回的消息
      if (result.code === 200) {
        toast.success(result.message || "删除成功", {
          duration: 3000,
        });
        
        // 从本地数据中移除
        setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
        setIsDeleteConfirmOpen(false);
      } else {
        toast.error(result.message || "删除失败", {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('删除学生失败:', error);
      if (error instanceof Error) {
        toast.error(error.message, {
          duration: 3000,
        });
      } else {
        toast.error("删除失败，请稍后重试", {
          duration: 3000,
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 检查是否有编辑权限
  const hasEditPermission = userRole ? ["admin", "teacher"].includes(userRole) : false;
  
  // 检查是否有删除权限（只有管理员）
  const hasDeletePermission = userRole === "admin";

  // 根据搜索条件筛选学生
  const filteredStudents = students.filter(student => 
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
      <Toaster richColors />
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
              {(hasEditPermission || hasDeletePermission) && 
                <TableHead className="text-right font-bold text-black dark:text-white">操作</TableHead>
              }
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.username}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  {(hasEditPermission || hasDeletePermission) && (
                    <TableCell className="text-right space-x-2">
                      {hasEditPermission && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditClick(student)}
                        >
                          修改信息
                        </Button>
                      )}
                      {hasDeletePermission && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteClick(student)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          删除
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={(hasEditPermission || hasDeletePermission) ? 3 : 2} className="text-center py-6 text-muted-foreground">
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

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>您确定要删除学生 <span className="font-bold">{studentToDelete?.username}</span> 吗？</p>
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