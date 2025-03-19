# 在线编程学习平台

这是一个基于 Next.js 开发的在线编程学习平台，为学生提供编程题目练习和实时代码评测功能。

## 功能特性

### 用户管理
- 多角色支持：管理员、教师、学生
- 用户认证和授权
- 个人信息管理

### 题目管理
- 题目列表展示
- 题目详情查看
- 代码在线编辑
- 实时代码评测
- 答题状态追踪（待完成、正确、错误）

### 编程环境
- 在线代码编辑器（Monaco Editor）
- Python 代码支持
- 实时语法高亮
- 代码自动补全

### 界面特性
- 响应式设计
- 暗色主题支持
- 友好的错误提示
- Toast 消息通知
- 加载状态展示

## 技术栈

### 前端
- Next.js 13+ (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui 组件库
- Monaco Editor 代码编辑器
- Sonner Toast 通知组件

### 后端集成
- RESTful API 接口
- JWT 认证
- 错误处理机制

## 项目结构

```
src/
├── app/                    # 应用主目录
│   ├── (main)/            # 主要页面路由
│   │   ├── problems/      # 题目相关页面
│   │   └── student/       # 学生管理页面
│   ├── api/               # API 路由
│   └── layout.tsx         # 全局布局
├── components/            # 公共组件
│   └── ui/               # UI 组件
├── lib/                  # 工具库
│   ├── services/         # API 服务
│   └── config.ts         # 全局配置
└── styles/               # 样式文件
```

## 环境要求

- Node.js 16+
- npm 或 yarn

## 环境变量配置

创建 `.env` 文件并配置以下环境变量：

```bash
# API 配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:7001/api

# Coze 配置
NEXT_PUBLIC_COZE_API_BASE=https://api.coze.cn
NEXT_PUBLIC_COZE_CLIENT_ID=your_client_id
NEXT_PUBLIC_COZE_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_COZE_REDIRECT_URI=http://localhost:3000/callback
NEXT_PUBLIC_COZE_WORKFLOW_ID=your_workflow_id
NEXT_PUBLIC_COZE_BOT_ID=your_bot_id

# JWT 配置
JWT_SECRET=your_jwt_secret

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database
```

## 安装和运行

1. 安装依赖
```bash
npm install
# 或
yarn install
```

2. 运行开发环境
```bash
npm run dev
# 或
yarn dev
```

3. 构建生产版本
```bash
npm run build
# 或
yarn build
```

## 使用说明

### 学生用户
1. 注册/登录账号
2. 浏览题目列表
3. 选择题目进行练习
4. 在线编写代码
5. 提交答案获取即时反馈

### 教师用户
1. 管理学生信息
2. 查看学生答题情况
3. 添加/编辑题目

### 管理员
1. 完整的系统管理权限
2. 用户角色管理
3. 系统配置管理

## 注意事项

1. 确保所有环境变量正确配置
2. 代码提交后会进行实时评测
3. 评测结果会通过 toast 消息提示
4. 答案正确会自动返回题目列表
5. 错误信息会显示具体的错误原因

## 开发规范

1. 使用 TypeScript 进行开发
2. 遵循 ESLint 规范
3. 使用 Prettier 进行代码格式化
4. 组件使用 shadcn/ui 规范
5. 错误提示统一使用 Sonner toast

## 错误处理

系统实现了完整的错误处理机制：
- API 调用错误
- 网络连接错误
- 权限验证错误
- 代码执行错误
- 输入验证错误

所有错误消息都会通过 toast 组件展示，持续时间为 5 秒，使用黑色文字以确保清晰可读。
