"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect, useCallback } from "react"

export function FabButton() {
  const router = useRouter()
  const [position, setPosition] = useState<{ x: number | string; y: number | string }>({ x: "auto", y: "auto" })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hasMoved, setHasMoved] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const clickStartTime = useRef(0)
  const startPosRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number | undefined>(undefined) // 用于RAF优化

  // Initialize position on mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!buttonRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    clickStartTime.current = Date.now()
    const touch = e.touches[0]
    const rect = buttonRef.current.getBoundingClientRect()
    startPosRef.current = { x: rect.left, y: rect.top }
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    clickStartTime.current = Date.now()
    const rect = buttonRef.current.getBoundingClientRect()
    startPosRef.current = { x: rect.left, y: rect.top }
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !buttonRef.current) return

    // 取消之前的动画帧
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // 使用 requestAnimationFrame 优化性能
    animationFrameRef.current = requestAnimationFrame(() => {
      const newX = clientX - dragOffset.x
      const newY = clientY - dragOffset.y

      // Check if actually moved more than 5px threshold
      const movedDistance = Math.sqrt(
        Math.pow(newX - startPosRef.current.x, 2) +
        Math.pow(newY - startPosRef.current.y, 2)
      )
      if (movedDistance > 5) {
        setHasMoved(true)
      }

      // 获取视口尺寸，考虑安全区域
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const buttonSize = 64 // w-16 = 4rem = 64px
      const padding = 16 // 边界padding
      const safeAreaBottom = 120 // 底部导航栏高度 + 额外安全距离

      // 严格边界检测
      const constrainedX = Math.max(padding, Math.min(newX, viewportWidth - buttonSize - padding))
      const constrainedY = Math.max(padding, Math.min(newY, viewportHeight - buttonSize - safeAreaBottom))

      // 磁性吸附效果 - 吸附到屏幕边缘
      const snapDistance = 30 // 30px 吸附距离
      let finalX = constrainedX
      let finalY = constrainedY

      // 水平磁性吸附
      if (constrainedX < snapDistance) {
        finalX = padding // 吸附到左边
      } else if (constrainedX > viewportWidth - buttonSize - padding - snapDistance) {
        finalX = viewportWidth - buttonSize - padding // 吸附到右边
      }

      // 垂直磁性吸附 - 吸附到顶部或底部安全区域
      if (constrainedY < snapDistance) {
        finalY = padding // 吸附到顶部
      } else if (constrainedY > viewportHeight - buttonSize - safeAreaBottom - snapDistance) {
        finalY = viewportHeight - buttonSize - safeAreaBottom // 吸附到底部安全区域
      }

      setPosition({ x: finalX, y: finalY })
    })
  }, [isDragging, dragOffset, startPosRef.current])

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleEnd = () => {
    setIsDragging(false)
    // 添加拖拽结束的视觉反馈 - 可以在这里添加一个微动画
    if (buttonRef.current && hasMoved) {
      // 简单的震动反馈，如果设备支持
      if ('vibrate' in navigator) {
        navigator.vibrate(10) // 10ms 轻微震动
      }
    }
  }

  const handleClick = () => {
    // Only navigate if it was a quick click (not a drag)
    const duration = Date.now() - clickStartTime.current
    // 优化触摸响应时间 - 减少到150ms
    if (duration < 150 && !hasMoved) {
      router.push("/scan")
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => handleMouseMove(e)
    const onTouchMove = (e: TouchEvent) => handleTouchMove(e)
    const onEnd = () => handleEnd()

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onEnd)
    document.addEventListener("touchmove", onTouchMove)
    document.addEventListener("touchend", onEnd)

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onEnd)
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", onEnd)
      // 清理动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isDragging, handleMove])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  if (!isMounted) return null

  const style: React.CSSProperties =
    typeof position.x === "string"
      ? {
          right: "24px",
          bottom: "104px", // 40px (bottom-10) + 64px (button height)
          pointerEvents: "auto",
        }
      : {
          left: `${position.x}px`,
          top: `${position.y}px`,
          pointerEvents: "auto",
        }

  return (
    <Button
      ref={buttonRef}
      onClick={handleClick}
      size="icon"
      className="fixed w-16 h-16 rounded-full shadow-xl z-50 hover:scale-105 active:scale-95 transition-all duration-150 ease-in-out touch-none select-none bg-black/90 text-white ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/25 touch-feedback"
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMoveCapture={(e) => e.preventDefault()} // 防止系统手势冲突
      onContextMenu={(e) => e.preventDefault()} // 禁止长按菜单
      draggable={false} // 禁止浏览器默认拖拽
    >
      <img
        src="/jimeng-2025-11-05-2611-logo_design,_a_minimalist,_friendly_came...png"
        alt="Scan"
        className="w-7 h-7 object-contain invert dark:invert-0 brightness-150 contrast-150 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)] pointer-events-none select-none"
        draggable={false}
      />
    </Button>
  )
}
