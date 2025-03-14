import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要登录就可以访问的路由
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否是公开路由
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // 获取token
  const token = request.cookies.get('token')?.value;

  // 如果是公开路由且已登录，重定向到问题列表
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/problems', request.url));
  }

  // 如果不是公开路由且未登录，重定向到登录页
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// 配置需要进行中间件处理的路由
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 