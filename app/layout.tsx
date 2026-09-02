import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { ErrorBoundary } from "@/components/error-boundary"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${_geist.className} antialiased`}>
        <ErrorBoundary maxRetries={3}>
          {/* 在桌面上显示灰色背景，模拟移动设备 */}
          <div className="min-h-screen bg-gray-100 md:bg-gray-200">
            {children}
          </div>
        </ErrorBoundary>
        <PerformanceMonitor />
      </body>
    </html>
  )
}
