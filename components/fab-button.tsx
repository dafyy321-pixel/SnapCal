"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"

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

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !buttonRef.current) return

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

    // Constrain to viewport with padding
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 64))
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 64))

    setPosition({ x: constrainedX, y: constrainedY })
  }

  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  const handleClick = () => {
    // Only navigate if it was a quick click (not a drag)
    const duration = Date.now() - clickStartTime.current
    // Click if: quick press (<200ms) AND didn't move significantly
    if (duration < 200 && !hasMoved) {
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
    }
  }, [isDragging])

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
      className="fixed w-16 h-16 rounded-full shadow-xl z-50 hover:scale-105 active:scale-95 transition-transform touch-none bg-black/90 text-white ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/25"
      style={style}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img src="/jimeng-2025-11-05-2611-logo_design,_a_minimalist,_friendly_came...png" alt="Scan" className="w-7 h-7 object-contain invert dark:invert-0 brightness-150 contrast-150 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" />
    </Button>
  )
}
