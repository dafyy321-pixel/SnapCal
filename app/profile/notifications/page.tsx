"use client"

import { ArrowLeft, Bell, Save, Clock, Utensils, Target } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { BottomNav } from "@/components/bottom-nav"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface NotificationSettings {
  mealReminders: boolean
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  snackReminders: boolean
  waterReminders: boolean
  waterInterval: number // 小时
  goalAchievements: boolean
  weeklyReports: boolean
  reportDay: string
  reportTime: string
  smartSuggestions: boolean
}

export default function NotificationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<string>('unknown')
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    mealReminders: true,
    breakfastTime: "08:00",
    lunchTime: "12:00",
    dinnerTime: "18:30",
    snackReminders: false,
    waterReminders: true,
    waterInterval: 2,
    goalAchievements: true,
    weeklyReports: true,
    reportDay: "1", // 周一
    reportTime: "20:00",
    smartSuggestions: true,
  })

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    setIsClient(true)

    const loadSettings = () => {
      const savedSettings = localStorage.getItem("notificationSettings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    }
    loadSettings()

    // 设置通知权限状态
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission)
        })
      }
    } else {
      setNotificationPermission('unsupported')
    }
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem("notificationSettings", JSON.stringify(settings))
      }

      // TODO: 实际项目中这里应该调用后端API保存设置并注册推送服务

      alert("通知设置已保存")
      router.back()
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      "1": "周一",
      "2": "周二",
      "3": "周三",
      "4": "周四",
      "5": "周五",
      "6": "周六",
      "0": "周日",
    }
    return days[day] || "周一"
  }

  const testNotification = (type: string) => {
    if (!isClient || notificationPermission !== "granted") {
      alert("请先允许浏览器通知权限")
      return
    }

    const messages: Record<string, string> = {
      meal: "用餐提醒：该记录今天的饮食了！",
      water: "喝水提醒：记得补充水分哦！",
      goal: "目标达成：太棒了，继续保持！",
      report: "周报提醒：查看本周营养状况",
    }

    new Notification("SnapCal 提醒", {
      body: messages[type] || "测试通知",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    })
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
            <h1 className="text-lg font-semibold text-foreground">通知设置</h1>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-10 h-10 rounded-full"
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-6">
          {/* 用餐提醒 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                用餐提醒
              </h3>
              <Switch
                checked={settings.mealReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, mealReminders: checked }))}
              />
            </div>

            {settings.mealReminders && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">早餐时间</label>
                  <input
                    type="time"
                    value={settings.breakfastTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, breakfastTime: e.target.value }))}
                    className="px-3 py-1 border rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">午餐时间</label>
                  <input
                    type="time"
                    value={settings.lunchTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, lunchTime: e.target.value }))}
                    className="px-3 py-1 border rounded-md text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">晚餐时间</label>
                  <input
                    type="time"
                    value={settings.dinnerTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, dinnerTime: e.target.value }))}
                    className="px-3 py-1 border rounded-md text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification("meal")}
                  className="w-full mt-2"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  测试用餐提醒
                </Button>
              </div>
            )}
          </Card>

          {/* 饮水提醒 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <Clock className="w-5 h-5 mr-2 text-blue-500" />
                饮水提醒
              </h3>
              <Switch
                checked={settings.waterReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, waterReminders: checked }))}
              />
            </div>

            {settings.waterReminders && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">提醒间隔</label>
                  <select
                    value={settings.waterInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, waterInterval: Number(e.target.value) }))}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    <option value={1}>每1小时</option>
                    <option value={2}>每2小时</option>
                    <option value={3}>每3小时</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification("water")}
                  className="w-full mt-2"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  测试饮水提醒
                </Button>
              </div>
            )}
          </Card>

          {/* 目标达成提醒 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <Target className="w-5 h-5 mr-2 text-green-500" />
                目标达成提醒
              </h3>
              <Switch
                checked={settings.goalAchievements}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, goalAchievements: checked }))}
              />
            </div>

            {settings.goalAchievements && (
              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground">
                  当您达成每日营养目标或连续记录里程碑时发送通知
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification("goal")}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  测试目标提醒
                </Button>
              </div>
            )}
          </Card>

          {/* 周报提醒 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center text-foreground">
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                周报提醒
              </h3>
              <Switch
                checked={settings.weeklyReports}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, weeklyReports: checked }))}
              />
            </div>

            {settings.weeklyReports && (
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">发送时间</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={settings.reportDay}
                      onChange={(e) => setSettings(prev => ({ ...prev, reportDay: e.target.value }))}
                      className="px-3 py-1 border rounded-md text-sm"
                    >
                      <option value="1">周一</option>
                      <option value="0">周日</option>
                    </select>
                    <input
                      type="time"
                      value={settings.reportTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, reportTime: e.target.value }))}
                      className="px-3 py-1 border rounded-md text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testNotification("report")}
                  className="w-full mt-2"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  测试周报提醒
                </Button>
              </div>
            )}
          </Card>

          {/* 智能建议 */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">智能建议</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  基于您的饮食习惯提供个性化建议
                </p>
              </div>
              <Switch
                checked={settings.smartSuggestions}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smartSuggestions: checked }))}
              />
            </div>
          </Card>

          {/* 零食提醒 */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">零食提醒</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  上午和下午的健康加餐提醒
                </p>
              </div>
              <Switch
                checked={settings.snackReminders}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, snackReminders: checked }))}
              />
            </div>
          </Card>

          {/* 通知权限状态 */}
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-blue-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">通知权限</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {!isClient
                  ? "检查通知权限中..."
                  : notificationPermission === 'unsupported'
                    ? "您的浏览器不支持通知功能"
                    : notificationPermission === "granted"
                      ? "已允许浏览器通知"
                      : notificationPermission === "denied"
                        ? "已禁止浏览器通知"
                        : "请允许浏览器通知权限"
                }
              </p>
              {isClient && notificationPermission === "default" && (
                <Button
                  onClick={() => {
                    Notification.requestPermission().then(permission => {
                      setNotificationPermission(permission)
                    })
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  开启通知权限
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}