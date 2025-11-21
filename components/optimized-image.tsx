/**
 * 优化图片组件
 * 提供懒加载、占位符、错误处理等功能
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError' | 'placeholder'> {
  // 占位符相关
  placeholder?: 'blur' | 'empty' | 'skeleton'
  placeholderSrc?: string

  // 懒加载相关
  lazy?: boolean
  rootMargin?: string
  threshold?: number

  // 错误处理
  fallbackSrc?: string
  maxRetries?: number
  onRetry?: (retryCount: number) => void

  // 加载状态
  showLoadingState?: boolean
  loadingComponent?: React.ComponentType<{ className?: string }>

  // 错误状态
  showErrorState?: boolean
  errorComponent?: React.ComponentType<{ error: Error; retry: () => void; className?: string }>

  // 性能优化
  priority?: boolean
  fetchPriority?: 'high' | 'low' | 'auto'

  // 样式相关
  containerClassName?: string
  imageClassName?: string
}

/**
 * 默认加载组件
 */
const DefaultLoadingComponent: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn(
    'animate-pulse bg-gray-200 rounded-lg',
    'flex items-center justify-center',
    className
  )}>
    <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
  </div>
)

/**
 * 默认错误组件
 */
const DefaultErrorComponent: React.FC<{
  error: Error;
  retry: () => void;
  className?: string
}> = ({ error, retry, className }) => (
  <div className={cn(
    'flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-200',
    'text-gray-500 text-sm',
    className
  )}>
    <div className="text-2xl mb-2">🖼️</div>
    <div className="text-center px-2">
      <div className="font-medium">图片加载失败</div>
      <button
        onClick={retry}
        className="mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
      >
        重试
      </button>
    </div>
  </div>
)

/**
 * 模糊占位符生成器
 */
const generateBlurPlaceholder = (width: number, height: number): string => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="14" font-family="system-ui">
        加载中...
      </text>
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * 优化图片组件
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  imageClassName,
  placeholder = 'empty',
  placeholderSrc,
  lazy = true,
  rootMargin = '50px',
  threshold = 0.1,
  fallbackSrc = '/placeholder.svg',
  maxRetries = 3,
  onRetry,
  showLoadingState = true,
  loadingComponent: LoadingComponent = DefaultLoadingComponent,
  showErrorState = true,
  errorComponent: ErrorComponent = DefaultErrorComponent,
  priority = false,
  fetchPriority = 'auto',
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const [imageSrc, setImageSrc] = useState(src)

  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 生成占位符
  const getPlaceholderSrc = () => {
    if (placeholderSrc) return placeholderSrc
    if (placeholder === 'blur' && width && height) {
      return generateBlurPlaceholder(Number(width), Number(height))
    }
    return undefined
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || !containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [lazy, priority, rootMargin, threshold])

  // 错误重试逻辑
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      setHasError(false)
      setError(null)
      setIsLoading(true)

      onRetry?.(retryCount + 1)

      // 切换到备用源或重新尝试原源
      const newSrc = retryCount > 0 && fallbackSrc ? fallbackSrc : src
      setImageSrc(newSrc)
    }
  }

  // 图片加载成功
  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    setRetryCount(0)
  }

  // 图片加载失败
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    const errorMessage = `图片加载失败: ${target.src}`

    setIsLoading(false)
    setHasError(true)
    setError(new Error(errorMessage))

    // 如果没有重试过，自动重试
    if (retryCount === 0) {
      setTimeout(handleRetry, 1000)
    }
  }

  // 构建 blurDataURL
  const blurDataURL = getPlaceholderSrc()

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
      style={{
        width: width || '100%',
        height: height || 'auto'
      }}
    >
      {/* 加载状态 */}
      {isLoading && showLoadingState && (
        <div className="absolute inset-0 z-10">
          <LoadingComponent className="w-full h-full" />
        </div>
      )}

      {/* 错误状态 */}
      {hasError && showErrorState && error && (
        <div className="absolute inset-0 z-10">
          <ErrorComponent
            error={error}
            retry={handleRetry}
            className="w-full h-full"
          />
        </div>
      )}

      {/* 实际图片 */}
      {isInView && (
        <Image
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            hasError ? 'hidden' : 'block',
            imageClassName
          )}
          placeholder={blurDataURL ? 'blur' : 'empty'}
          priority={priority}
          fetchPriority={fetchPriority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={handleLoad}
          onError={handleError}
          {...imageProps}
        />
      )}
    </div>
  )
}

/**
 * 食物图片专用组件
 */
interface FoodImageProps extends Omit<OptimizedImageProps, 'fallbackSrc'> {
  foodName?: string
}

export const FoodImage: React.FC<FoodImageProps> = ({
  foodName = '食物',
  className,
  ...props
}) => {
  const foodErrorComponent: React.FC<{
    error: Error;
    retry: () => void;
    className?: string
  }> = ({ className }) => (
    <div className={cn(
      'flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border border-orange-200',
      'text-orange-600 text-sm',
      className
    )}>
      <div className="text-3xl mb-2">🍽️</div>
      <div className="text-center px-2">
        <div className="font-medium">{foodName}</div>
        <div className="text-xs text-orange-500 mt-1">图片暂时无法显示</div>
      </div>
    </div>
  )

  return (
    <OptimizedImage
      {...props}
      className={cn('rounded-lg', className)}
      fallbackSrc="/food-placeholder.svg"
      errorComponent={foodErrorComponent}
      placeholder="empty"
      showLoadingState={true}
      showErrorState={true}
    />
  )
}

/**
 * 用户头像专用组件
 */
interface UserAvatarProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: number
  username?: string
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  size = 40,
  username = '用户',
  className,
  ...props
}) => {
  const avatarErrorComponent: React.FC<{
    error: Error;
    retry: () => void;
    className?: string
  }> = ({ className }) => (
    <div className={cn(
      'flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full border border-blue-200',
      'text-blue-600 font-medium text-sm',
      className
    )} style={{ width: size, height: size }}>
      {username.slice(0, 1).toUpperCase()}
    </div>
  )

  return (
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      fallbackSrc={`/avatar-placeholder-${size}.png`}
      errorComponent={avatarErrorComponent}
      placeholder="empty"
      showLoadingState={true}
      showErrorState={true}
    />
  )
}