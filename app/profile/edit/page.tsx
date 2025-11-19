"use client"

import { ArrowLeft, Camera, Save, User, Mail, Phone, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BottomNav } from "@/components/bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/supabase"
import { useState, useEffect } from "react"

export default function ProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    height: "",
    weight: "",
  })

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await authService.getCurrentUser()
        const storedUser = localStorage.getItem("user")

        if (user && storedUser) {
          const userInfo = JSON.parse(storedUser)
          setUserData({
            name: userInfo.username || user.user_metadata?.username || "",
            email: user.email || "",
            phone: userInfo.phone || user.user_metadata?.phone || "",
            birthday: user.user_metadata?.birthday || "",
            gender: user.user_metadata?.gender || "",
            height: user.user_metadata?.height || "",
            weight: user.user_metadata?.weight || "",
          })
        }
      } catch (error) {
        console.error("加载用户信息错误:", error)
      }
    }
    loadUserData()
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      // 这里应该调用API更新用户信息
      // 目前先保存到localStorage
      const userInfo = JSON.parse(localStorage.getItem("user") || "{}")
      userInfo.username = userData.name
      userInfo.phone = userData.phone

      localStorage.setItem("user", JSON.stringify(userInfo))

      // 显示保存成功提示
      alert("个人资料已更新")
      router.back()
    } catch (error) {
      console.error("保存失败:", error)
      alert("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = () => {
    // TODO: 实现头像上传功能
    alert("头像上传功能开发中...")
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
            <h1 className="text-lg font-semibold text-foreground">编辑个人资料</h1>
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
          {/* 头像部分 */}
          <Card className="p-6">
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/30 text-3xl">
                    {userData.name ? userData.name.slice(0, 1) : "👤"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarUpload}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105"
                >
                  <Camera className="w-5 h-5 text-primary-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">点击更换头像</p>
            </div>
          </Card>

          {/* 基本信息 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">基本信息</h3>
            <div className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                  <User className="w-4 h-4 mr-2" />
                  姓名
                </label>
                <Input
                  type="text"
                  placeholder="请输入姓名"
                  value={userData.name}
                  onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                  <Mail className="w-4 h-4 mr-2" />
                  邮箱
                </label>
                <Input
                  type="email"
                  placeholder="请输入邮箱"
                  value={userData.email}
                  disabled
                  className="w-full bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">邮箱地址不可修改</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                  <Phone className="w-4 h-4 mr-2" />
                  手机号
                </label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  value={userData.phone}
                  onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  生日
                </label>
                <Input
                  type="date"
                  value={userData.birthday}
                  onChange={(e) => setUserData(prev => ({ ...prev, birthday: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">性别</label>
                <div className="flex gap-3">
                  <Button
                    variant={userData.gender === "male" ? "default" : "outline"}
                    onClick={() => setUserData(prev => ({ ...prev, gender: "male" }))}
                    className="flex-1"
                  >
                    男
                  </Button>
                  <Button
                    variant={userData.gender === "female" ? "default" : "outline"}
                    onClick={() => setUserData(prev => ({ ...prev, gender: "female" }))}
                    className="flex-1"
                  >
                    女
                  </Button>
                  <Button
                    variant={userData.gender === "other" ? "default" : "outline"}
                    onClick={() => setUserData(prev => ({ ...prev, gender: "other" }))}
                    className="flex-1"
                  >
                    其他
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* 身体数据 */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">身体数据</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">身高 (cm)</label>
                <Input
                  type="number"
                  placeholder="请输入身高"
                  value={userData.height}
                  onChange={(e) => setUserData(prev => ({ ...prev, height: e.target.value }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">体重 (kg)</label>
                <Input
                  type="number"
                  placeholder="请输入体重"
                  value={userData.weight}
                  onChange={(e) => setUserData(prev => ({ ...prev, weight: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}