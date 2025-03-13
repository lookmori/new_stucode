"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// 用户角色类型
type Role = "admin" | "teacher" | "student";

// 模拟用户数据
const mockUser = {
  username: "张三",
  email: "zhangsan@example.com",
  password: "123456",
  role: "student" as Role,
};

// 模拟做题数据
const mockExerciseData = [
  { date: "2024-01-01", count: 5 },
  { date: "2024-01-02", count: 8 },
  { date: "2024-01-03", count: 3 },
  { date: "2024-01-04", count: 12 },
  { date: "2024-01-05", count: 7 },
  { date: "2024-01-06", count: 9 },
  { date: "2024-01-07", count: 6 },
];

export default function ProfilePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState(mockUser);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    // 这里应该调用API保存用户信息
    console.log("保存用户信息:", userInfo);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUserInfo(mockUser); // 重置为原始数据
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      {/* 用户信息卡片 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>个人信息</CardTitle>
          <CardDescription>查看和修改您的个人信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">用户名</label>
                {isEditing ? (
                  <Input
                    value={userInfo.username}
                    onChange={(e) => setUserInfo({ ...userInfo, username: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{userInfo.username}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">邮箱</label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1">{userInfo.email}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">密码</label>
                {isEditing ? (
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={userInfo.password}
                      onChange={(e) => setUserInfo({ ...userInfo, password: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center mt-1">
                    <p className="mr-2">{showPassword ? userInfo.password : "••••••"}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    取消
                  </Button>
                  <Button onClick={handleSave}>保存</Button>
                </>
              ) : (
                <Button onClick={handleEdit}>编辑</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 做题统计图表（仅对学生显示） */}
      {userInfo.role === "student" && (
        <Card>
          <CardHeader>
            <CardTitle>做题统计</CardTitle>
            <CardDescription>最近7天的做题数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockExerciseData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 