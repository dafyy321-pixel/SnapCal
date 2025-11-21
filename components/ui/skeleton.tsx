"use client"

import { cn } from '@/lib/utils'
import { memo } from 'react'

interface SkeletonProps {
  className?: string
  variant?: "default" | "text" | "circular" | "rounded" | "shimmer"
  width?: string | number
  height?: string | number
  lines?: number
  animate?: boolean
}

function Skeleton({
  className,
  variant = "default",
  width,
  height,
  lines = 1,
  animate = true,
  ...props
}: SkeletonProps & React.ComponentProps<'div'>) {
  if (lines > 1) {
    return (
      <div className={cn("space-y-2", className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-accent",
              variant === "text" && "h-4 rounded",
              variant === "circular" && "h-4 rounded-full w-4",
              variant === "rounded" && "h-4 rounded-lg",
              variant === "shimmer" && "skeleton",
              animate && "animate-pulse"
            )}
            style={{
              width: i === lines - 1 ? "80%" : "100%",
              height: height || "1rem"
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-accent",
        variant === "text" && "h-4 rounded",
        variant === "circular" && "rounded-full",
        variant === "rounded" && "rounded-lg",
        variant === "shimmer" && "skeleton",
        animate && "animate-pulse",
        className
      )}
      style={{
        width: width || "100%",
        height: height || "1rem"
      }}
      {...props}
    />
  )
}

// 卡片骨架屏
interface CardSkeletonProps {
  className?: string
  showImage?: boolean
  showAvatar?: boolean
  lines?: number
  animate?: boolean
  onClick?: () => void
}

const CardSkeleton = memo<CardSkeletonProps>(({
  className,
  showImage = true,
  showAvatar = false,
  lines = 3,
  animate = true,
  onClick
}) => {
  return (
    <div
      className={cn("p-4 rounded-lg border bg-card shadow-sm cursor-pointer", className)}
      onClick={onClick}
    >
      {showAvatar && (
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton variant="circular" width={40} height={40} animate={animate} />
          <div className="flex-1">
            <Skeleton width="60%" height={16} animate={animate} />
            <Skeleton width="40%" height={12} animate={animate} />
          </div>
        </div>
      )}

      {showImage && (
        <div className="flex gap-4 mb-4">
          <Skeleton variant="rounded" width={80} height={80} animate={animate} />
          <div className="flex-1">
            <Skeleton width="90%" height={16} animate={animate} className="mb-2" />
            <Skeleton lines={2} animate={animate} />
          </div>
        </div>
      )}

      {!showImage && !showAvatar && (
        <div className="space-y-3">
          <Skeleton width="80%" height={20} animate={animate} />
          <Skeleton lines={lines} animate={animate} />
        </div>
      )}
    </div>
  )
})

CardSkeleton.displayName = "CardSkeleton"

// 列表骨架屏
interface ListSkeletonProps {
  className?: string
  items?: number
  showImage?: boolean
  animate?: boolean
}

const ListSkeleton = memo<ListSkeletonProps>(({
  className,
  items = 3,
  showImage = true,
  animate = true
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton
          key={i}
          showImage={showImage}
          animate={animate}
        />
      ))}
    </div>
  )
})

ListSkeleton.displayName = "ListSkeleton"

// 统计卡片骨架屏
interface StatsSkeletonProps {
  className?: string
  cards?: number
  animate?: boolean
}

const StatsSkeleton = memo<StatsSkeletonProps>(({
  className,
  cards = 3,
  animate = true
}) => {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-card shadow-sm">
          <Skeleton width="60%" height={32} animate={animate} className="mb-3" />
          <Skeleton width="80%" height={12} animate={animate} className="mb-4" />
          <Skeleton variant="circular" width={64} height={64} animate={animate} className="mx-auto" />
        </div>
      ))}
    </div>
  )
})

StatsSkeleton.displayName = "StatsSkeleton"

// 首页专用骨架屏
interface HomePageSkeletonProps {
  className?: string
  animate?: boolean
}

const HomePageSkeleton = memo<HomePageSkeletonProps>(({ className, animate = true }) => {
  return (
    <div className={cn("space-y-6", className)}>
      {/* 顶部区域骨架屏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton variant="circular" width={32} height={32} animate={animate} />
          <Skeleton width={120} height={24} animate={animate} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={24} height={24} animate={animate} />
          <Skeleton width={30} height={20} animate={animate} />
        </div>
      </div>

      {/* 周选择器骨架屏 */}
      <div className="flex items-center justify-center gap-3">
        <Skeleton variant="circular" width={32} height={32} animate={animate} />
        <div className="flex gap-2 flex-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton variant="circular" width={48} height={48} animate={animate} />
              <Skeleton width={20} height={12} animate={animate} />
            </div>
          ))}
        </div>
        <Skeleton variant="circular" width={32} height={32} animate={animate} />
      </div>

      {/* 主要卡路里卡片骨架屏 */}
      <div className="p-6 rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton width={160} height={64} animate={animate} className="mb-2" />
            <Skeleton width={120} height={16} animate={animate} className="mb-1" />
            <Skeleton width={140} height={12} animate={animate} className="mb-2" />
            <Skeleton width={200} height={12} animate={animate} />
          </div>
          <Skeleton variant="circular" width={128} height={128} animate={animate} />
        </div>
      </div>

      {/* 营养素卡片骨架屏 */}
      <StatsSkeleton cards={3} animate={animate} />

      {/* 餐食记录骨架屏 */}
      <div className="space-y-3">
        <Skeleton width={80} height={20} animate={animate} />
        <ListSkeleton items={2} showImage animate={animate} />
      </div>
    </div>
  )
})

HomePageSkeleton.displayName = "HomePageSkeleton"

export { Skeleton, CardSkeleton, ListSkeleton, StatsSkeleton, HomePageSkeleton }
