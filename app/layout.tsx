import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { ErrorBoundary } from "@/components/error-boundary"
import { NetworkStatus } from "@/components/network-status"
import { apiCache } from "@/lib/cache/api-cache"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SnapCal",
  description: "AI\u9a71\u52a8\u7684\u5361\u8def\u91cc\u548c\u8425\u517b\u8ffd\u8e2a\u5e94\u7528",
  generator: "v0.app",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // 在客户端启用全局API缓存
  if (typeof window !== 'undefined') {
    apiCache.setup()
  }

  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        <ErrorBoundary maxRetries={3}>
          {/* 在桌面上显示灰色背景，模拟移动设备 */}
          <div className="min-h-screen bg-gray-100 md:bg-gray-200">
            <NetworkStatus />
            {children}
          </div>
        </ErrorBoundary>
        <ErrorBoundary>
        <Analytics />
      </ErrorBoundary>
        <PerformanceMonitor />
      </body>
    </html>
  )
}
