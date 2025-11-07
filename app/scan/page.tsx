"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, X, ImageIcon, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ScanPage() {
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  // 使用两个 input：一个强制打开相机（capture），一个选择相册
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("图片过大，请选择小于 10MB 的图片")
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setImage(event.target?.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!image) return
    setIsAnalyzing(true)
    setError(null)

    try {
      // Convert data URL to blob
      const response = await fetch(image)
      const blob = await response.blob()

      // Create FormData and upload
      const formData = new FormData()
      formData.append("image", blob, "photo.jpg")

      // Call analyze API
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!analyzeResponse.ok) {
        throw new Error("分析失败")
      }

      const result = await analyzeResponse.json()
      if (result.success) {
        setAnalysisResult(result.data)
        // Store result in session for analysis page
        sessionStorage.setItem("analysisResult", JSON.stringify(result.data))
        router.push("/analysis")
      } else {
        setError(result.error || "分析失败，请重试")
      }
    } catch (err) {
      console.error("[Scan] Analysis error:", err)
      setError("分析失败，请检查网络连接")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClose = () => {
    router.push("/")
  }

  const handleReset = () => {
    setImage(null)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black/20 md:bg-gray-200 z-50 flex items-center justify-center">
      {/* 容器 - 在大屏幕上限制为手机尺寸 */}
      <div className="w-full h-full max-w-md bg-background flex flex-col md:shadow-2xl md:h-[90vh] md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h1 className="text-xl font-bold">扫描食物</h1>
          <Button variant="ghost" size="icon" onClick={handleClose} disabled={isAnalyzing}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* 预览区 */}
        <div className="flex-1 relative bg-black">
          {!image && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
              <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/25 shadow-md">
                <img src="/jimeng-2025-11-05-2611-logo_design,_a_minimalist,_friendly_came...png" alt="Scan" className="w-16 h-16 object-contain invert brightness-200 contrast-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-white">准备扫描</h2>
                <p className="text-sm text-muted-foreground">拍照或上传图片以分析食物营养</p>
              </div>
            </div>
          )}

          {image && (
            <img src={image || "/placeholder.svg"} alt="Captured food" className="w-full h-full object-contain" />
          )}

          {/* Loading Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 flex flex-col items-center justify-center gap-6 backdrop-blur-sm">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-white/20 rounded-full" />
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-white text-lg font-semibold">正在分析食物...</p>
                <p className="text-white/70 text-sm">预计 5-10 秒</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-white/80 text-xs font-medium">AI 识别中</span>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 bg-background">
          {!image && !isAnalyzing && (
            <div className="flex gap-3">
              <Button onClick={() => cameraInputRef.current?.click()} className="flex-1 h-14 text-base" size="lg">
                <Camera className="w-5 h-5 mr-2" />
                打开相机
              </Button>
              <Button
                onClick={() => galleryInputRef.current?.click()}
                variant="outline"
                className="flex-1 h-14 text-base"
                size="lg"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                选择图片
              </Button>
            </div>
          )}

          {image && (
            <div className="flex gap-3">
              <Button onClick={handleReset} variant="outline" className="flex-1 h-14 text-base bg-transparent" size="lg" disabled={isAnalyzing}>
                重新拍摄
              </Button>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 h-14 text-base relative overflow-hidden" size="lg">
                {isAnalyzing ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary animate-pulse" />
                    <div className="relative flex items-center justify-center">
                      <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      分析中...
                    </div>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI 分析
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 强制拉起相机 */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* 相册选择 */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
  )
}
