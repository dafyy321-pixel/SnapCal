import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { PerformanceMonitor } from "@/components/performance-monitor"
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
  return (
    <html lang="zh-CN">
      <body className={`font-sans antialiased`}>
        {/* 在桌面上显示灰色背景，模拟移动设备 */}
        <div className="min-h-screen bg-gray-100 md:bg-gray-200">
          {children}
        </div>
        <Analytics />
        <PerformanceMonitor />
      </body>
    </html>
  )
}
