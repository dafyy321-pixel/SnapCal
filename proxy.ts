import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 代理中间件
 * 在Next.js 16中，middleware已重命名为proxy
 * 保护需要认证的客户端路由和API端点
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 需要保护的路由列表
  const protectedRoutes = [
    '/profile',
    '/analytics',
    '/meal',
    '/analysis',
    '/scan'
  ]

  // API路由中需要保护的部分
  const protectedApiRoutes = [
    '/api/meals',
    '/api/analytics',
    '/api/analysis',
    '/api/auth/login-records'
  ]

  // 检查是否为受保护的路由
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    pathname.startsWith(route)
  )

  // 排除认证相关路由，避免循环重定向
  const isAuthRoute = pathname.startsWith('/auth') || pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')

  // 如果访问受保护的路由，需要验证认证状态
  if ((isProtectedRoute || isProtectedApiRoute) && !isAuthRoute) {
    // 从Cookie中获取Supabase token
    const supabaseToken = request.cookies.get('sb-access-token')?.value

    // 对于API路由，也检查Authorization header
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.replace('Bearer ', '')

    const hasValidToken = supabaseToken || bearerToken

    if (!hasValidToken) {
      // 未登录用户重定向到登录页面
      if (!pathname.startsWith('/api/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      } else {
        // API路由返回401错误
        return NextResponse.json(
          {
            success: false,
            error: '未授权访问',
            code: 'UNAUTHORIZED',
            message: '请先登录以访问此资源'
          },
          { status: 401 }
        )
      }
    }

    // TODO: 可以在这里添加token验证逻辑
    // 目前仅检查token存在性，实际项目中应验证token有效性
  }

  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')
    return response
  }

  // 添加安全响应头
  const response = NextResponse.next()

  // 仅对API路由添加安全头
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  }

  return response
}

/**
 * 代理匹配配置
 * 定义哪些路径需要经过此代理处理
 */
export const proxyConfig = {
  matcher: [
    /*
     * 匹配所有需要处理的路径，排除静态文件和内部Next.js路由
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}