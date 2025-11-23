"use client"

import { Skeleton } from "./skeleton"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import { memo } from "react"

interface LoadingStateProps {
  type?: "default" | "spinner" | "skeleton" | "card"
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export const LoadingState = memo<LoadingStateProps>(({
  type = "default",
  message = "加载中...",
  size = "md",
  className
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  if (type === "spinner") {
    return (
      <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
        <div className={cn(
          "border-4 border-primary border-t-transparent rounded-full animate-spin",
          sizeClasses[size]
        )} />
        <p className={cn("text-muted-foreground", textSizes[size])}>{message}</p>
      </div>
    )
  }

  if (type === "skeleton") {
    return (
      <div className={cn("animate-pulse", className)}>
        <div className="flex items-center justify-center space-y-3">
          <div className={cn(
            "bg-muted rounded-full",
            sizeClasses[size]
          )} />
          <p className={cn("text-muted-foreground", textSizes[size])}>{message}</p>
        </div>
      </div>
    )
  }

  if (type === "card") {
    return (
      <div className={cn(
        "p-6 rounded-lg border bg-card shadow-sm",
        className
      )}>
        <div className="flex items-center space-x-4">
          <Flame className={cn(
            "text-amber-500 animate-pulse",
            size === "sm" ? "w-5 h-5" : size === "md" ? "w-8 h-8" : "w-12 h-12"
          )} />
          <div className="flex-1">
            <Skeleton width="60%" height={size === "sm" ? 16 : size === "md" ? 20 : 24} />
            <Skeleton width="40%" height={12} className="mt-2" />
          </div>
        </div>
        <div className="mt-4">
          <Skeleton lines={2} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="text-center">
        <div className={cn(
          "border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4",
          sizeClasses[size]
        )} />
        <p className={cn("text-muted-foreground", textSizes[size])}>{message}</p>
      </div>
    </div>
  )
})

LoadingState.displayName = "LoadingState"

// 页面级加载状态
interface PageLoadingProps {
  message?: string
  className?: string
}

export const PageLoading = memo<PageLoadingProps>(({
  message = "加载中...",
  className
}) => {
  return (
    <div className={cn("min-h-screen bg-background flex items-center justify-center", className)}>
      <LoadingState type="default" message={message} size="lg" />
    </div>
  )
})

PageLoading.displayName = "PageLoading"

// 内容加载状态 - 用于内容区域的加载
interface ContentLoadingProps {
  children?: React.ReactNode
  isLoading?: boolean
  skeleton?: React.ReactNode
  className?: string
}

export const ContentLoading = memo<ContentLoadingProps>(({
  children,
  isLoading = false,
  skeleton,
  className
}) => {
  if (isLoading) {
    return (
      <div className={className}>
        {skeleton || <LoadingState type="skeleton" />}
      </div>
    )
  }

  return <>{children}</>
})

ContentLoading.displayName = "ContentLoading"