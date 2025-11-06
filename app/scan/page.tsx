"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Camera, X, ImageIcon, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function ScanPage() {
  const router = useRouter()
  const [image, setImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
      setStream(mediaStream)
      setCameraActive(true)
    } catch (error) {
      console.error("[Scan] Error accessing camera:", error)
      setError("无法访问相机。请检查权限设置。")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
      setCameraActive(false)
    }
  }, [stream])

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas")
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0)
        const imageData = canvas.toDataURL("image/jpeg", 0.9)
        setImage(imageData)
        stopCamera()
      }
    }
  }, [stopCamera])

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
    stopCamera()
    router.push("/")
  }

  const handleReset = () => {
    setImage(null)
    setCameraActive(false)
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

      {/* Camera/Image View */}
      <div className="flex-1 relative bg-black">
        {!image && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
            <div className="w-32 h-32 rounded-full bg-muted/20 flex items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-white">准备扫描</h2>
              <p className="text-sm text-muted-foreground">拍照或上传图片以分析食物营养</p>
            </div>
          </div>
        )}

        {cameraActive && !image && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}

        {image && (
          <img src={image || "/placeholder.svg"} alt="Captured food" className="w-full h-full object-contain" />
        )}

        {/* Camera Overlay */}
        {cameraActive && !image && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
            </div>
            <div className="absolute bottom-32 left-0 right-0 text-center">
              <p className="text-white text-sm font-medium">将食物放在框内</p>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="text-white font-medium">分析中...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4 bg-background">
        {!image && !cameraActive && !isAnalyzing && (
          <div className="flex gap-3">
            <Button onClick={startCamera} className="flex-1 h-14 text-base" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              打开相机
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex-1 h-14 text-base"
              size="lg"
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              选择图片
            </Button>
          </div>
        )}

        {cameraActive && !image && !isAnalyzing && (
          <div className="flex gap-3">
            <Button onClick={stopCamera} variant="outline" className="flex-1 h-14 text-base bg-transparent" size="lg">
              取消
            </Button>
            <Button onClick={capturePhoto} className="flex-1 h-14 text-base" size="lg">
              <Camera className="w-5 h-5 mr-2" />
              拍照
            </Button>
          </div>
        )}

        {image && (
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1 h-14 text-base bg-transparent" size="lg" disabled={isAnalyzing}>
              重新拍摄
            </Button>
            <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 h-14 text-base" size="lg">
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  分析中...
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

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      </div>
      </div>
    </div>
  )
}
