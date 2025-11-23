"use client"

import { ArrowLeft, Download, Calendar, FileText, BarChart, Share2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function ExportPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exportRange, setExportRange] = useState("week")
  const [exportFormat, setExportFormat] = useState("json")
  const [exportType, setExportType] = useState("all")
  const [dataAvailable, setDataAvailable] = useState({
    hasData: false,
    totalMeals: 0,
    dateRange: { start: "", end: "" },
  })

  useEffect(() => {
    const checkDataAvailability = () => {
      // 模拟检查数据可用性
      // 实际项目中应该从API获取数据统计信息
      const mockData = {
        hasData: true,
        totalMeals: 127,
        dateRange: {
          start: "2024-01-01",
          end: new Date().toISOString().split('T')[0]
        }
      }
      setDataAvailable(mockData)
    }
    checkDataAvailability()
  }, [])

  const handleExport = async () => {
    setLoading(true)
    try {
      // TODO: 实际项目中应该调用API导出数据
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟API调用

      // 模拟下载数据
      const exportData = generateMockExportData()
      downloadFile(exportData)

      alert("数据导出成功！")
    } catch (error) {
      console.error("导出失败:", error)
      alert("导出失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const generateMockExportData = () => {
    // 生成模拟导出数据
    return {
      exportInfo: {
        date: new Date().toISOString(),
        format: exportFormat,
        range: exportRange,
        type: exportType,
        totalRecords: dataAvailable.totalMeals
      },
      data: {
        meals: [
          {
            id: 1,
            name: "鸡胸肉沙拉",
            calories: 320,
            protein: 45,
            carbs: 12,
            fats: 8,
            date: "2024-01-15",
            meal_type: "lunch"
          },
          // 更多模拟数据...
        ],
        analytics: {
          avgCalories: 1850,
          totalWeightLost: 2.5,
          streakDays: 15
        }
      }
    }
  }

  const downloadFile = (data: any) => {
    let content: string
    let filename: string
    let mimeType: string

    switch (exportFormat) {
      case "json":
        content = JSON.stringify(data, null, 2)
        filename = `snapcal-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = "application/json"
        break
      case "csv":
        content = convertToCSV(data)
        filename = `snapcal-export-${new Date().toISOString().split('T')[0]}.csv`
        mimeType = "text/csv"
        break
      case "pdf":
        // PDF生成比较复杂，这里只是模拟
        alert("PDF导出功能开发中，请选择JSON或CSV格式")
        return
      default:
        content = JSON.stringify(data, null, 2)
        filename = `snapcal-export-${new Date().toISOString().split('T')[0]}.json`
        mimeType = "application/json"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any) => {
    if (data.data?.meals) {
      const meals = data.data.meals
      const headers = ["日期", "餐次", "食物", "卡路里", "蛋白质(g)", "碳水(g)", "脂肪(g)"]
      const rows = meals.map((meal: any) => [
        meal.date,
        meal.meal_type,
        meal.name,
        meal.calories,
        meal.protein,
        meal.carbs,
        meal.fats
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }
    return "No data available"
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "SnapCal 营养数据",
          text: "我在SnapCal记录了我的营养数据，快来一起健康饮食吧！",
          url: window.location.origin
        })
      } catch (error) {
        console.error("分享失败:", error)
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.origin)
      alert("链接已复制到剪贴板")
    }
  }

  const getRangeText = (range: string) => {
    switch (range) {
      case "week": return "最近一周"
      case "month": return "最近一月"
      case "quarter": return "最近三月"
      case "year": return "最近一年"
      case "all": return "全部时间"
      default: return "最近一周"
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        {/* 顶部导航栏 */}
        <div className="bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-12 pb-6 px-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">数据导出</h1>
            <Button
              onClick={handleShare}
              variant="outline"
              className="w-10 h-10 rounded-full"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 数据概览 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <BarChart className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">数据概览</h3>
              {dataAvailable.hasData ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-blue-600">{dataAvailable.totalMeals}</p>
                  <p className="text-sm text-muted-foreground">条饮食记录</p>
                  <p className="text-xs text-muted-foreground">
                    {dataAvailable.dateRange.start} 至 {dataAvailable.dateRange.end}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无数据可导出</p>
              )}
            </div>
          </Card>

          {/* 导出设置 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">导出设置</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">时间范围</label>
                <Select value={exportRange} onValueChange={setExportRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">最近一周</SelectItem>
                    <SelectItem value="month">最近一月</SelectItem>
                    <SelectItem value="quarter">最近三月</SelectItem>
                    <SelectItem value="year">最近一年</SelectItem>
                    <SelectItem value="all">全部时间</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">导出格式</label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON (推荐)</SelectItem>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="pdf">PDF 报告</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">导出内容</label>
                <Select value={exportType} onValueChange={setExportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">完整数据</SelectItem>
                    <SelectItem value="meals">仅饮食记录</SelectItem>
                    <SelectItem value="analytics">仅统计数据</SelectItem>
                    <SelectItem value="goals">仅目标设置</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* 导出预览 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">导出预览</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">时间范围:</span>
                <span className="font-medium">{getRangeText(exportRange)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">导出格式:</span>
                <span className="font-medium">{exportFormat.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">包含内容:</span>
                <span className="font-medium">{exportType === "all" ? "完整数据" : exportType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">预计大小:</span>
                <span className="font-medium">~{Math.max(10, dataAvailable.totalMeals * 0.1)}KB</span>
              </div>
            </div>
          </Card>

          {/* 快速导出选项 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">快速导出</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setExportRange("month")
                  setExportFormat("json")
                  setExportType("all")
                }}
                className="h-auto p-3"
              >
                <FileText className="w-5 h-5 mb-2 mx-auto" />
                <div className="text-xs">本月记录</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setExportRange("quarter")
                  setExportFormat("csv")
                  setExportType("meals")
                }}
                className="h-auto p-3"
              >
                <Calendar className="w-5 h-5 mb-2 mx-auto" />
                <div className="text-xs">季度报告</div>
              </Button>
            </div>
          </Card>

          {/* 导出按钮 */}
          <Button
            onClick={handleExport}
            disabled={loading || !dataAvailable.hasData}
            className="w-full py-3 text-lg"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                导出中...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                开始导出
              </>
            )}
          </Button>

          {/* 使用提示 */}
          <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="text-center">
              <h4 className="font-semibold mb-2 text-foreground">使用提示</h4>
              <ul className="text-sm text-muted-foreground text-left space-y-1">
                <li>• JSON格式适合数据备份和恢复</li>
                <li>• CSV格式可以在Excel中打开分析</li>
                <li>• PDF格式适合打印和分享</li>
                <li>• 导出的数据可以用于备份或迁移</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}