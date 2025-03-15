import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 不需要登录就可以访问的路由
const publicRoutes = ['/login', '/register', '/api/auth'];

// 检查路径是否匹配公开路由
const isPublicPath = (path: string) => {
  return publicRoutes.some(route => path.startsWith(route));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和API路由
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/static') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }
  
  // 检查是否是公开路由
  const isPublicRoute = isPublicPath(pathname);
  
  // 获取token
  const token = request.cookies.get('token')?.value;
  const hasToken = !!token;

  // 如果是公开路由且已登录，重定向到问题列表
  if (isPublicRoute && hasToken) {
    return NextResponse.redirect(new URL('/problems', request.url));
  }

  // 如果不是公开路由且未登录，重定向到登录页
  if (!isPublicRoute && !hasToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 配置需要进行中间件处理的路由
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 